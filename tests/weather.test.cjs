const { test } = require('node:test');
const assert = require('node:assert/strict');
const { findCity, readWeather, describeWeather, locationError } = require('../weather');
const response = data => async () => ({ ok: true, json: async () => data });
const weather = { timezone: 'Asia/Kolkata', current: { time: '2026-10-22T12:00', temperature_2m: 0, apparent_temperature: -2, relative_humidity_2m: 0, weather_code: 0, wind_speed_10m: 0 } };
test('city names are encoded, with multiple matches retained', async () => {
  const cities = [{ name: 'Paris' }, { name: 'Paris' }];
  const result = await findCity(' A&B ', async url => {
    assert.equal(new URL(url).searchParams.get('name'), 'A&B');
    return { ok: true, json: async () => ({ results: cities }) };
  });
  assert.equal(result.length, 2);
});
test('blank and unknown cities produce useful errors', async () => {
  await assert.rejects(findCity(' '), /two characters/);
  await assert.rejects(findCity('Unknown', response({})), /No matching city/);
});
test('weather preserves coordinate order and valid zero values', async () => {
  const result = await readWeather(0, -73.5, async url => {
    const params = new URL(url).searchParams;
    assert.equal(params.get('latitude'), '0');
    assert.equal(params.get('longitude'), '-73.5');
    assert.equal(params.get('timezone'), 'auto');
    return { ok: true, json: async () => weather };
  });
  assert.equal(result.current.temperature_2m, 0);
});
test('bad coordinates never reach the service', async () => {
  for (const [lat, lon] of [[91, 0], [0, 181], [NaN, 1]]) await assert.rejects(readWeather(lat, lon), /coordinates/);
});
test('HTTP failures and incomplete payloads are rejected', async () => {
  await assert.rejects(readWeather(1, 1, async () => ({ ok: false })), /unavailable/);
  await assert.rejects(readWeather(1, 1, response({ current: {} })), /incomplete/);
  await assert.rejects(readWeather(1, 1, response({ ...weather, current: { ...weather.current, temperature_2m: null } })), /incomplete/);
});
test('timeouts and geolocation failure reasons are actionable', async () => {
  await assert.rejects(readWeather(1, 1, async () => { const error = new Error(); error.name = 'AbortError'; throw error; }), /timed out/);
  assert.match(locationError({ code: 1 }), /permission.*denied/);
  assert.match(locationError({ code: 3 }), /timed out/);
  assert.match(locationError({ code: 2 }), /unavailable/);
});
test('weather code categories include rain, snow and thunderstorms', () => {
  assert.equal(describeWeather(0), 'Clear sky');
  assert.equal(describeWeather(82), 'Rain');
  assert.equal(describeWeather(86), 'Snow');
  assert.equal(describeWeather(99), 'Thunderstorm');
});
