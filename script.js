const button = document.getElementById("clickButton")
const loc = document.getElementById("loc")
const dateTime = document.getElementById("currentTime")
const temp = document.getElementById("temp")
const latlong = document.getElementById("latlong")
async function gotPosition(position){
    console.log(position)
    
    var longitude = position.coords.longitude
    var latitude = position.coords.latitude
    searchLoction(longitude,latitude)
    
}
async function searchLoction(longitude,latitude){
        const getData = await fetch(`http://api.weatherapi.com/v1/current.json?key=ff094cd206494d00bad115207252312&q=${latitude},${longitude}&aqi=yes`)
        const data = await getData.json()
        console.log(data)
        loc.innerText=`You are currently at ${data.location.name} and in the region ${data.location.region} and in the country ${data.location.country}`
        dateTime.innerText=`Current Date and current time : ${data.location.localtime} and Timezone : ${data.location.tz_id}`
        temp.innerText=`Current Temperature is : ${data.current.temp_c} , feels like :${data.current.feelslike_c} & Humidity is : ${data.current.humidity}`
        latlong.innerText = `Current Latitude: ${latitude} & Longitude: ${longitude}`
    } 
function failedToGet(){
    console.log("Not able to get location")
}
button.addEventListener("click",async ()=>{
    navigator.geolocation.getCurrentPosition(gotPosition,failedToGet)

})
