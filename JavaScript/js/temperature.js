function toFahrenite(c) {
    let f = c * 9 / 5 + 32;
    f = Math.round(f * 10) / 10;
    console.log(c + '°C is ' + f + '°F')
}

function toCelsius(f) {
    let c = (f - 32) * 5 / 9;
    c = Math.round(c * 10) / 10;
    console.log(f + '°F is ' + c + '°C') 
}
toFahrenite(100);
toCelsius(32);
toFahrenite(0);
toCelsius(212);