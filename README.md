# Weather Location Dashboard

Current weather, local time, and coordinates in a responsive browser dashboard.

- Search a city and choose among matching locations.
- Use your device location with an explicit permission prompt and a city-search fallback.
- View temperature, feels-like temperature, humidity, wind, conditions, timezone, and weather timestamp.
- See useful messages for denied permissions, unavailable locations, timeouts, and service failures.

## Run locally

Serve this directory with `python -m http.server 8000`, then open http://localhost:8000. Device location requires HTTPS or localhost. No build step, dependency installation, or API key is needed.

## Checks

With Node.js 20 or newer:

```sh
npm test
npm run check
```

Regression tests use mocked responses; they do not depend on the public service being online. GitHub Actions runs them before deploying to Pages.

## Data and privacy

Weather comes from [Open-Meteo](https://open-meteo.com/en/docs), with city matching from its [geocoding API](https://open-meteo.com/en/docs/geocoding-api) based on GeoNames. The free endpoint is for non-commercial use and is subject to service availability and limits. Weather values are model-based current conditions, not a personal weather-station reading.

City searches are sent to the geocoding service. Device coordinates are requested only after selecting **Use my location** and are sent to the weather service. This app does not persist location data. The device-location view shows coordinates rather than claiming an unverified city name.

Built with HTML, CSS, and JavaScript by Vishesh Gupta.
