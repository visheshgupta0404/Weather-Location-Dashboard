"use strict";
const byId = id => document.getElementById(id);
const form = byId("search-form");
const searchButton = byId("search-button");
const locationButton = byId("clickButton");
const status = byId("status");
const choices = byId("city-choices");
let busy = false;
function setBusy(value, message) {
  busy = value;
  searchButton.disabled = value;
  locationButton.disabled = value;
  byId("dashboard").setAttribute("aria-busy", String(value));
  if (message) status.textContent = message;
}
function showError(error) {
  status.textContent = error.message || "Could not load weather. Check your connection and try again.";
  byId("weather-result").hidden = true;
}
async function showWeather(place) {
  setBusy(true, "Loading current weather…");
  choices.replaceChildren();
  try {
    const data = await Weather.readWeather(place.latitude, place.longitude);
    const current = data.current;
    byId("loc").textContent = place.name;
    byId("condition").textContent = Weather.describeWeather(current.weather_code);
    byId("temp").textContent = `${Math.round(current.temperature_2m)}°C`;
    byId("feels-like").textContent = `${Math.round(current.apparent_temperature)}°C`;
    byId("humidity").textContent = `${current.relative_humidity_2m}%`;
    byId("wind").textContent = `${current.wind_speed_10m} km/h`;
    byId("currentTime").textContent = current.time.replace("T", " · ");
    byId("timezone").textContent = data.timezone;
    byId("latlong").textContent = `${place.latitude.toFixed(3)}, ${place.longitude.toFixed(3)}`;
    byId("weather-result").hidden = false;
    status.textContent = "Weather updated. Times are local to the selected location.";
  } catch (error) { showError(error); }
  finally { setBusy(false); }
}
function cityLabel(city) {
  return [...new Set([city.name, city.admin1, city.country].filter(Boolean))].join(", ");
}
form.addEventListener("submit", async event => {
  event.preventDefault();
  if (busy) return;
  setBusy(true, "Searching for cities…");
  choices.replaceChildren();
  byId("weather-result").hidden = true;
  try {
    const cities = await Weather.findCity(byId("city").value);
    if (cities.length === 1) await showWeather({ ...cities[0], name: cityLabel(cities[0]) });
    else {
      for (const city of cities) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "city-choice";
        button.textContent = cityLabel(city);
        button.addEventListener("click", () => { if (!busy) showWeather({ ...city, name: cityLabel(city) }); });
        choices.append(button);
      }
      status.textContent = "Choose the city you mean:";
    }
  } catch (error) { showError(error); }
  finally { setBusy(false); }
});
locationButton.addEventListener("click", () => {
  if (busy) return;
  choices.replaceChildren();
  byId("weather-result").hidden = true;
  if (!navigator.geolocation) {
    showError(new Error("Your browser does not support location. Search for a city instead."));
    return;
  }
  setBusy(true, "Waiting for your location…");
  navigator.geolocation.getCurrentPosition(
    position => showWeather({ latitude: position.coords.latitude, longitude: position.coords.longitude, name: "Your current location" }),
    error => { showError(new Error(Weather.locationError(error))); setBusy(false); },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
  );
});
