const button = document.getElementById("clickButton");
const loc = document.getElementById("loc");
const dateTime = document.getElementById("currentTime");
const temp = document.getElementById("temp");
async function gotPosition(position) {
  console.log(position);

  var longitude = position.coords.longitude;
  var latitude = position.coords.latitude;
  searchLoction(longitude, latitude);
}
async function searchLoction(longitude, latitude) {
  try {
    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=ff094cd206494d00bad115207252312&q=${latitude},${longitude}&aqi=yes`
    );

    if (!response.ok) {
      throw new Error("Weather API blocked");
    }

    const data = await response.json();
    console.log("API DATA:", data);

    loc.innerText = `You are currently at ${data.location.name}, ${data.location.region}, ${data.location.country}`;
    dateTime.innerText = `Current Date & Time: ${data.location.localtime}`;
    temp.innerText = `Current Temperature: ${data.current.temp_c}°C`;

  } catch (error) {
    console.error(error);
    loc.innerText = "Weather data not accessible on deployed site ❌";
    dateTime.innerText = "";
    temp.innerText = "";
  }
}
function failedToGet() {
  console.log("Not able to get location");
}
button.addEventListener("click", async () => {
  navigator.geolocation.getCurrentPosition(gotPosition, failedToGet);
});
