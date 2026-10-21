"use strict";

async function requestJSON(url, fetcher = fetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetcher(url, { signal: controller.signal });
    if (!response.ok) throw new Error("The weather service is unavailable. Please try again.");
    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") throw new Error("The request timed out. Please try again.");
    if (error instanceof TypeError) throw new Error("Could not reach the weather service. Check your connection and try again.");
    throw error;
  } finally { clearTimeout(timeout); }
}

async function findCity(query, fetcher) {
  const name = query.trim();
  if (name.length < 2) throw new Error("Enter at least two characters for a city.");
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.search = new URLSearchParams({ name, count: "5", language: "en", format: "json" });
  const data = await requestJSON(url, fetcher);
  if (!Array.isArray(data.results) || !data.results.length) throw new Error("No matching city found. Check the spelling and try again.");
  return data.results;
}

async function readWeather(latitude, longitude, fetcher) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw new Error("The location coordinates are invalid.");
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), timezone: "auto", current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m" });
  const data = await requestJSON(url, fetcher);
  const current = data.current;
  const numbers = [current?.temperature_2m, current?.relative_humidity_2m, current?.apparent_temperature, current?.weather_code, current?.wind_speed_10m];
  if (!current || numbers.some(value => !Number.isFinite(value)) || typeof current.time !== "string" || typeof data.timezone !== "string") throw new Error("The weather service returned incomplete data. Please try again.");
  return data;
}

function describeWeather(code) {
  if (code === 0) return "Clear sky";
  if ([1, 2, 3].includes(code)) return "Partly cloudy / overcast";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Weather conditions";
}
function locationError(error) {
  if (error.code === 1) return "Location permission was denied. Search for a city instead.";
  if (error.code === 3) return "Finding your location timed out. Try again or search for a city.";
  return "Your location is unavailable. Search for a city instead.";
}
const Weather = { findCity, readWeather, describeWeather, locationError };
if (typeof module !== "undefined") module.exports = Weather;
if (typeof window !== "undefined") window.Weather = Weather;
