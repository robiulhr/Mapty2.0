class Workout {
    #allMonth = ["January", "February", "March", "April", "June", "July", "August", "September", "October", "November", "December"]
    _date = new Date();
    _id = Math.floor((Math.random() * this._date.getSeconds() * 1000000))
    constructor(location, distance, duration) {
        this.location = location;
        this.distance = distance;
        this.duration = duration;
        this._createDateStr();
    }
    _createDateStr() {
        return this.dateStr = `${this.#allMonth[this._date.getMonth()]} ${this._date.getDate()}`
    }
}

class Cycling extends Workout {
    constructor(location, distance, duration, elevGain) {
        super(location, distance, duration)
        this.type = "Cycling"
        this.elevGain = elevGain
        this._calcSpeed()
    }
    _calcSpeed() {
        return this.speed = this.distance / (this.duration / 60);
    }
}

class Running extends Workout {
    constructor(location, distance, duration, cadence) {
        super(location, distance, duration)
        this.type = "Running"
        this.cadence = cadence
        this._calcPace()
    }
    _calcPace() {
        return this.pace = this.duration / this.distance;
    }
}

class App {
    #map
    #mapLatlng
    #swalWithBootstrapButtons
    // getting dom elements
    _html =  document.querySelector("html");
    _body = document.querySelector("body");
    _form = document.querySelector(".form");
    _distanceInput = document.querySelector(".form__input--distance");
    _typeInput = document.querySelector(".form__input--type");
    _durationInput = document.querySelector(".form__input--duration");
    _cadenceInput = document.querySelector(".form__input--cadence");
    _elevationInput = document.querySelector(".form__input--elevation");
    _formCross = this._form.querySelector(".form__cross");
    _noDataAvailable = document.querySelector(".no-data-available");
    _workoutsDiv = document.querySelector(".workouts");
    _toggle = document.querySelector("#toggle");
    constructor() {
        this.workout = [];
        this.defaultTheme = "dark";
        this.savedTheme;
        // calling the events
        this._form.addEventListener("submit", this._formSubmit.bind(this));
        this._typeInput.addEventListener("change", this._changeWorkoutType.bind(this));
        this._formCross.addEventListener("click", this._formShowHide.bind(this));
        this._workoutsDiv.addEventListener("workoutshown", this._moveMapToWorkout.bind(this));
        this._toggle.addEventListener("click",this._changeTheme.bind(this));
        // calling ask geoLocation function
        this._askTheGeolocation();
        this._setTheme()
    }



    _askTheGeolocation() {
        if (navigator.geolocation) {
            this.#swalWithBootstrapButtons = Swal.mixin({
                buttonsStyling: true
            })
            navigator.geolocation.getCurrentPosition((locationEvant) => {
                const croods = this._geolocationCoords(locationEvant)
                this._showThemap(croods);
                this._renderWorkout();
            }, (locationEror) => {
                this._showTheErrorForGeolocation()
            });
        }
    }

    _geolocationCoords(locationEvent) {
        const { latitude, longitude } = locationEvent.coords
        return [latitude, longitude]
    }

    _showThemap(coords) {
        try {
            this.#map = L.map('map').setView(coords, 15);
            L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png').addTo(this.#map);
            this.#map.on('click', function (mapEvent) {
                this._formShowHide();
                this.#mapLatlng = Object.values(mapEvent.latlng);
            }.bind(this));
        } catch (err) {
            console.log(err, "map error")
        }

    }

    _showTheErrorForGeolocation() {
        this.#swalWithBootstrapButtons.fire({
            title: 'You haven\'nt allowed the location.',
            text: "Please Give the permission to use the app.",
            icon: 'warning',
            showCancelButton: false,
            confirmButtonText: 'Try again.',
            reverseButtons: false
        }).then((result) => {
            if (result.isDismissed) showTheErrorForGeolocation()
            else if (result.isConfirmed) {
                this._askTheGeolocation()
            }
        })
    }
    _showWorkout() {
        if (this._workoutsDiv.classList.contains("hidden")) this._workoutsDiv.classList.remove("hidden");
        if (!this._noDataAvailable.classList.contains("hidden")) this._noDataAvailable.classList.add("hidden");
    }

    _hideWorkout() {
        if (!this._workoutsDiv.classList.contains("hidden")) this._workoutsDiv.classList.add("hidden");
        if (this._noDataAvailable.classList.contains("hidden")) this._noDataAvailable.classList.remove("hidden");
    }

    _formShowHide() {
        this._form.classList.toggle("hidden")
        this._distanceInput.value = "", this._durationInput.value = "", this._cadenceInput.value = "", this._elevationInput.value = ""
        this._distanceInput.focus();
    }
    _changeTheme(e){
        this.savedTheme = window.localStorage.getItem("theme") || this.defaultTheme
        this.savedTheme == "dark" ?   this.savedTheme = "light" : this.savedTheme = "dark"
        window.localStorage.setItem("theme",this.savedTheme);
        this._setTheme()
    }
    _setTheme(){
        this.savedTheme = window.localStorage.getItem("theme") || this.defaultTheme
        this.savedTheme == "dark" ? this._toggle.checked = false :this._toggle.checked = true 
        this._html.setAttribute("data-theme",this.savedTheme)
    }

    _formSubmit(e) {
        e.preventDefault()
        let formValues = [this._typeInput.value, this._distanceInput.value, this._durationInput.value, this._cadenceInput.value, this._elevationInput.value]
        let allValueOk = this._checkInputFeild(...formValues);
        if (allValueOk) {
            this._addWorkout(...formValues, this.#mapLatlng);
            this._renderWorkout();
        }
    }

    _checkInputFeild(type, distance, duration, cadence, elevGain) {
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
        } else {
            return true;
        }
    }

    _addWorkout(type, distance, duration, cadence, elevGain, mapLatlng) {
        const workout = type == "running" ? new Running(mapLatlng, distance, duration, cadence) : new Cycling(mapLatlng, distance, duration, elevGain);
        const savedData = this._getSavedData()
        savedData.push(workout);
        this._saveData(savedData);
    }

    _getSavedData() {
        return JSON.parse(window.localStorage.getItem('workoutData')) || [];
    }

    _saveData(data) {
        window.localStorage.setItem("workoutData", JSON.stringify(data));
    }

    _renderWorkout() {
        const savedData = this._getSavedData()
        if (savedData.length > 0) {
            this._showWorkout();
            this._workoutsDiv.innerHTML = ""
            savedData.forEach((ele, ind) => {
                this._workoutsDiv.innerHTML += `<li class="workout workout--${ele.type.slice(0, 1).toLowerCase() + ele.type.slice(1)}" data-id=${ele._id}>
                <h2 class="workout__title">${ele.type} on ${ele.dateStr}</h2>
                <div class="workout__details">
                  <span class="workout__icon">${ele.type == "Running" ? '🏃‍♂️' : '🚴‍♀️'}</span>
                  <span class="workout__value">${ele.distance}</span>
                  <span class="workout__unit">km</span>
                </div>
                <div class="workout__details">
                  <span class="workout__icon">${"⏱"}</span>
                  <span class="workout__value">${ele.duration}</span>
                  <span class="workout__unit">min</span>
                </div>
                <div class="workout__details">
                  <span class="workout__icon">⚡️</span>
                  <span class="workout__value">${ele.type == "Running" ? ele.pace : ele.speed}</span>
                  <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                  <span class="workout__icon">${ele.type == "Running" ? "🦶🏼" : "⛰"}</span>
                  <span class="workout__value">${ele.type == "Running" ? ele.cadence : ele.elevGain}</span>
                  <span class="workout__unit">${ele.type == "Running" ? "spm" : "m"}</span>
                </div>
              </li>`
                this._mapMarker(ele.location, ele.type, ele.dateStr);
            })
            const workoutsDivEvent = new CustomEvent("workoutshown")
            this._workoutsDiv.dispatchEvent(workoutsDivEvent)
        } else this._hideWorkout();

    }

  
    _mapMarker(mapLatlngValue, type, dateStr) {
        L.circle(mapLatlngValue, { radius: 30 }).addTo(this.#map);
        L.marker(mapLatlngValue).addTo(this.#map).bindPopup(`${type == "Running" ? '🏃‍♂️' : '🚴‍♀️'} ${type} on ${dateStr}`, { maxWidth: 200, maxHeight: 500, closeButton: false, className: `${type.slice(0, 1).toLowerCase() + type.slice(1)}-popup` }).openPopup()
    }


    _changeWorkoutType(e) {
        e.preventDefault();
        this._form.querySelector(".form__input--cadence").parentElement.classList.toggle("form__row--hidden")
        this._form.querySelector(".form__input--elevation").parentElement.classList.toggle("form__row--hidden")
    }

    _moveMapToWorkout() {
        this._workoutsDiv.querySelectorAll("li").forEach(function (elem) {
            elem.addEventListener("click", function (e) {
                const savedData = JSON.parse(window.localStorage.getItem('workoutData'))
                let coords = savedData.find(ele => ele._id == elem.attributes[1].value).location
                // const coords = savedData[ele.attributes[1].value].location
                this.#map.setView(coords, 15);
            }.bind(this))
        }.bind(this))
    }
}

// if the user is ofline or online 

class IsOnline {
    _body = document.querySelector("body")
    _retryButton;
    constructor() {
        if (navigator.onLine) {
            new App();
        } else {
            this._showOffline()
        }
        window.addEventListener('online', this._getOnline.bind(this));
        window.addEventListener('offline', this._showOffline.bind(this));
    }

    _showOffline(e) {
        this._retryButton = document.querySelector(".button.retry")
        this._body.classList.add("offline");
        this._retryButton.addEventListener('click', () => location.reload())
    }

    _getOnline(e) {
        location.reload()
        this._body.classList.remove("offline");
    }
}

new IsOnline();