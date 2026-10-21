const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Weather = require('../weather');
function page(service = Weather, geolocation) {
  const elements = new Map();
  const element = () => ({ textContent: '', hidden: true, disabled: false, value: '', children: [], events: {},
    setAttribute() {}, replaceChildren() { this.children = []; }, append(child) { this.children.push(child); },
    addEventListener(event, callback) { this.events[event] = callback; } });
  const get = id => { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); };
  vm.runInNewContext(fs.readFileSync(require.resolve('../script.js'), 'utf8'), {
    document: { getElementById: get, createElement: element }, navigator: { geolocation }, Weather: service,
  });
  return get;
}
test('denied location gives a visible fallback and re-enables controls', () => {
  const get = page(Weather, { getCurrentPosition(success, failure) { failure({ code: 1 }); } });
  get('clickButton').events.click();
  assert.match(get('status').textContent, /denied.*Search for a city/);
  assert.equal(get('clickButton').disabled, false);
  assert.equal(get('weather-result').hidden, true);
});
test('search cannot send duplicate requests while one is pending', async () => {
  let finish, calls = 0;
  const get = page({ ...Weather, findCity() { calls++; return new Promise(resolve => { finish = resolve; }); } });
  get('city').value = 'Paris';
  const submit = () => get('search-form').events.submit({ preventDefault() {} });
  const pending = submit(); await submit();
  assert.equal(calls, 1);
  finish([{ name: 'Paris', latitude: 1, longitude: 2 }, { name: 'Paris', latitude: 3, longitude: 4 }]);
  await pending;
  assert.equal(get('city-choices').children.length, 2);
  assert.equal(get('search-button').disabled, false);
});
test('successful search renders all metrics, then failure hides stale results', async () => {
  let fail = false;
  const get = page({ ...Weather,
    findCity: async () => [{ name: 'Test city', country: '<unsafe>', latitude: 0, longitude: 0 }],
    readWeather: async () => { if (fail) throw new Error('Service unavailable'); return { timezone: 'UTC', current: { temperature_2m: 0, apparent_temperature: -2, relative_humidity_2m: 0, wind_speed_10m: 0, weather_code: 0, time: '2026-10-22T12:00' } }; },
  });
  const submit = () => get('search-form').events.submit({ preventDefault() {} });
  await submit();
  assert.equal(get('temp').textContent, '0°C');
  assert.equal(get('humidity').textContent, '0%');
  assert.equal(get('feels-like').textContent, '-2°C');
  assert.equal(get('timezone').textContent, 'UTC');
  assert.equal(get('loc').textContent, 'Test city, <unsafe>');
  assert.equal(get('weather-result').hidden, false);
  fail = true; await submit();
  assert.equal(get('weather-result').hidden, true);
  assert.equal(get('search-button').disabled, false);
});
