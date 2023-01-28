const form = document.querySelector(".form");
const distanceInput = document.querySelector(".form__input--distance");
const typeInput = document.querySelector(".form__input--type");
const durationInput = document.querySelector(".form__input--duration");
const cadenceInput = document.querySelector(".form__input--cadence");
const elevationInput = document.querySelector(".form__input--elevation");
const formCross = form.querySelector(".form__cross");
const noDataAvailable = document.querySelector(".no-data-available");
const workoutsDiv = document.querySelector(".workouts");
const allMonth = ["January","February","March","April","June","July","August","September","October","November","December"]

let map, mapLatlng, swalWithBootstrapButtons;

function geolocationCoords(locationEvent) {
    const { latitude, longitude } = locationEvent.coords
    return [latitude, longitude]
}

function showThemap(coords) {
    map = L.map('map').setView(coords, 15);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png').addTo(map);
    map.on('click', function (mapEvent) {
        formShowHide()
        mapLatlng = Object.values(mapEvent.latlng);
    });
}



function showTheErrorForGeolocation() {
    swalWithBootstrapButtons.fire({
        title: 'You haven\'nt allowed the location.',
        text: "Please Give the permission to use the app.",
        icon: 'warning',
        showCancelButton: false,
        confirmButtonText: 'Try again.',
        reverseButtons: false
    }).then((result) => {
        if (result.isDismissed) showTheErrorForGeolocation()
        else if (result.isConfirmed) {
            askTheGeolocation()
        }
    })
}

function askTheGeolocation() {
    if (navigator.geolocation) {
        swalWithBootstrapButtons = Swal.mixin({
            buttonsStyling: true
        })
        navigator.geolocation.getCurrentPosition((locationEvant) => {
            const croods = geolocationCoords(locationEvant)
            showThemap(croods);
            showHideWorkout();
        }, (locationEror) => {
            showTheErrorForGeolocation()
        });
    }
}

function checkInputFeild(type, distance, duration, cadence, elevGain) {
    if (!distance || !duration || (type == "running" ? !cadence : !elevGain)) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Please provide all the information.',
        })
    } else if (isNaN(distance) || isNaN(duration) || (type == "running" ? isNaN(cadence) : isNaN(elevGain))) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Please provide a number.',
        })
    }else{
     return true;
    }
}

function addWorkout(type, distance, duration, cadence, elevGain,mapLatlng,dateStr) {
    const workout = {
        type,
        distance,
        duration,
        mapLatlng,
        dateStr
    }
    type == "running" ? workout.cadence = cadence : workout.elevGain = elevGain;

    let savedData =  JSON.parse(window.localStorage.getItem('workoutData')) || []
    savedData.push(workout);
    window.localStorage.setItem("workoutData", JSON.stringify(savedData));
}

function showHideWorkout() {
    let savedData =  JSON.parse(window.localStorage.getItem('workoutData')) || [];
    if (savedData.length > 0) {
        if (workoutsDiv.classList.contains("hidden")) workoutsDiv.classList.remove("hidden");
        if(!noDataAvailable.classList.contains("hidden")) noDataAvailable.classList.add("hidden");
        workoutsDiv.innerHTML = ""
        savedData.forEach((ele,ind) => {
            workoutsDiv.innerHTML += `<li class="workout workout--${ele.type}" data-id=${ind}>
            <h2 class="workout__title">${ele.type=="running"?'Running':'Cycling'} on ${ele.dateStr}</h2>
            <div class="workout__details">
              <span class="workout__icon">${ele.type=="running"?'🏃‍♂️':'🚴‍♀️'}</span>
              <span class="workout__value">${ele.distance}</span>
              <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">${"⏱"}</span>
              <span class="workout__value">${ele.distance}</span>
              <span class="workout__unit">min</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${ele.distance}</span>
              <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">${ele.type=="running"?"🦶🏼":"⛰"}</span>
              <span class="workout__value">${ele.type == "running" ? ele.cadence : ele.elevGain}</span>
              <span class="workout__unit">${ele.type == "running" ? "spm" : "m"}</span>
            </div>
          </li>`
         mapMarker(map,ele.mapLatlng,ele.type,ele.dateStr);
        })
        const workoutsDivEvent = new CustomEvent("workoutshown")
        workoutsDiv.dispatchEvent(workoutsDivEvent)
    }else{

    }

}

function formShowHide() {
    form.classList.toggle("hidden")
    distanceInput.value = "", durationInput.value = "", cadenceInput.value = "", elevationInput.value = ""
    distanceInput.focus();
}

function mapMarker(mapValue, mapLatlngValue,type,dateStr) {
    L.circle(mapLatlngValue, { radius: 30 }).addTo(mapValue);
    L.marker(mapLatlngValue).addTo(map).bindPopup(`${type=="running"? '🏃‍♂️':'🚴‍♀️'} ${type} on ${dateStr}`, { maxWidth: 200, maxHeight: 500, closeButton: false, className: "running-popup" }).openPopup()
}

form.addEventListener("submit", (e) => {
    e.preventDefault()
    let date = new Date()
    let dateMonth = date.getMonth()
    let dateStr = allMonth[dateMonth] + " " + date.getDate()
    let formValues = [typeInput.value, distanceInput.value, durationInput.value, cadenceInput.value, elevationInput.value]
    let allValueOk = checkInputFeild(...formValues)
    if (allValueOk) {
        addWorkout(...formValues,mapLatlng,dateStr);
        showHideWorkout()
    }

})

typeInput.addEventListener("change", (e) => {
    e.preventDefault()
    form.querySelector(".form__input--cadence").parentElement.classList.toggle("form__row--hidden")
    form.querySelector(".form__input--elevation").parentElement.classList.toggle("form__row--hidden")
})

formCross.addEventListener("click", (e) => {
    e.preventDefault()
    formShowHide()
})

workoutsDiv.addEventListener("workoutshown",(event)=>{
    workoutsDiv.querySelectorAll("li").forEach(ele=>{
        ele.addEventListener("click",(e)=>{
        const savedData = JSON.parse(window.localStorage.getItem('workoutData'))
        const coords = savedData[ele.attributes[1].value].mapLatlng
            map.setView(coords, 15);
        })
    })
})

askTheGeolocation();