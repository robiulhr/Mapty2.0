const allMonth = ["January", "February", "March", "April", "June", "July", "August", "September", "October", "November", "December"]

class Workout {
    #_date = new Date();
    constructor(id, location, distance, duration) {
        this.id = id || Math.floor((Math.random() * this.#_date.getSeconds() * 1000000))
        this.location = location;
        this.distance = distance;
        this.duration = duration;
        this._createDateStr();
    }
    _createDateStr() {
        return this.dateStr = `${allMonth[this.#_date.getMonth()]} ${this.#_date.getDate()}`
    }
}


class Cycling extends Workout {
    constructor(id, location, distance, duration, elevGain) {
        super(id, location, distance, duration)
        this.type = "Cycling"
        this.elevGain = elevGain
        this._calcSpeed()
    }
    _calcSpeed() {
        return this.speed = (this.distance / (this.duration / 60)).toFixed(3);
    }
}

class Running extends Workout {
    constructor(id, location, distance, duration, cadence) {
        super(id, location, distance, duration)
        this.type = "Running"
        this.cadence = cadence
        this._calcPace()
    }
    _calcPace() {
        return this.pace = (this.duration / this.distance).toFixed(3);
    }
}



class App {
    #map;
    #mapLatlng;
    #swalWithBootstrapButtons = Swal.mixin({buttonsStyling: true});
    #updateWorkoutDataId = null;
    // getting dom elements
    _html = document.querySelector("html");
    _body = document.querySelector("body");
    _mapDiv = document.querySelector("#map");
    _form = document.querySelector(".form");
    _distanceInput = document.querySelector(".form__input--distance");
    _typeInput = document.querySelector(".form__input--type");
    _durationInput = document.querySelector(".form__input--duration");
    _cadenceInput = document.querySelector(".form__input--cadence");
    _elevationInput = document.querySelector(".form__input--elevation");
    _formCross = this._form.querySelector(".form__cross");
    _noDataAvailable = document.querySelector(".no-data-available");
    _workoutsWrapper = document.querySelector(".workouts-wrapper");
    _workoutsDiv = document.querySelector(".workouts");
    _toggle = document.querySelector("#toggle");
    _timerDiv = document.querySelector("#timer");
    _paginate;
    constructor() {
        this.workout = {};
        this.defaultTheme = "dark";
        this.currentMonth = new Date().getMonth();
        this.savedTheme;
        // calling the events
        this._form.addEventListener("submit", this._formSubmitCallback.bind(this));
        this._typeInput.addEventListener("change", this._inputTypeCallback.bind(this));
        this._formCross.addEventListener("click", this._formShowHideCallback.bind(this));
        this._workoutShownEvent = new CustomEvent("workoutshown")
        this._workoutsDiv.addEventListener("workoutshown", this._workwoutShownCallback.bind(this));
        this._toggle.addEventListener("click", this._changeThemeCallback.bind(this));
        this._body.addEventListener("mapoptionshown", function () {
            document.querySelector("#map_add_data_btn").addEventListener("click", this._formShowHideCallback.bind(this))
            document.querySelector("#map_timer_button").addEventListener("click", this._timerShowHideCallback.bind(this))
        }.bind(this));
        // calling ask geoLocation function
        this._askTheGeolocation();
        this._setTheme();
    }
    /**
     * 
     */
    _askTheGeolocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((locationEvant) => {
                const croods = this._geolocationCoords(locationEvant)
                this._showThemap(croods);                
                // create the pagination and render the workout 
                    this._paginate = new ProPaginate({
                        data: this._getSavedData().data || [],
                        itemsView:"column_view",
                        dataItemsArrayPath:"data",
                        startpageNum:this.currentMonth,
                        pageLinkAreaLabel:["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"],
                        dataItemHtml:'<li class="workout workout--${paginateDataObj.type.slice(0,1).toLowerCase()+paginateDataObj.type.slice(1)}" data-id=${paginateDataObj.id}><div class="workout__item"><h2 class="workout__title">${paginateDataObj.type} on ${paginateDataObj.dateStr}</h2><div class="workout__buttons"><div class="edit" style="margin:0 10px"><span class="material-symbols-outlined">edit</span></div><div class="delete"><span class="material-symbols-outlined">delete</span></div></div></div><div class="workout__details__wrapper"><div class="workout__details"><span class="workout__icon">${paginateDataObj.type == "Running" ? "🏃‍♂️" : "🚴‍♀️"}</span><span class="workout__value">${paginateDataObj.distance}</span><span class="workout__unit">km</span></div><div class="workout__details"><span class="workout__icon">${"⏱"}</span><span class="workout__value">${paginateDataObj.duration}</span><span class="workout__unit">min</span></div><div class="workout__details"><span class="workout__icon">⚡️</span><span class="workout__value">${paginateDataObj.type == "Running" ? paginateDataObj.pace : paginateDataObj.speed}</span><span class="workout__unit">min/km</span></div><div class="workout__details"><span class="workout__icon">${paginateDataObj.type == "Running" ? "🦶🏼" : "⛰"}</span><span class="workout__value">${paginateDataObj.type == "Running" ? paginateDataObj.cadence : paginateDataObj.elevGain}</span><span class="workout__unit">${paginateDataObj.type == "Running" ? "spm" : "m"}</span></div></div></li>',
                        singleDataItemArrayEmptyErrorHtml: '<div class="no-data-available"><img src="./img/others/no-data.png" alt=""><p>You havn\'t add any workout this month.</p></div>',
                        mainDataArrayEmptyErrorHtml:'<div class="no-data-available"><img src="./img/others/no-data.png" alt=""><p>Add your workout record by clicking the map.</p></div>',
                        onPageRender:function(){
                            this._workoutsDiv.dispatchEvent(this._workoutShownEvent);
                        }.bind(this)
                    })
                    if(this._getSavedData().data){
                        this._workoutsDiv.dispatchEvent(this._workoutShownEvent);
                    }          
            }, (locationEror) => {
                this._showTheErrorForGeolocation();
            });
        } else {
            this._showOldBrowserError();
            this._showOldBrowserErrorPage("Old version Browser.", "Please use modern one.")
        }
    }

    _showOldBrowserError() {
        this.#swalWithBootstrapButtons.fire({
            title: 'Old version Browser.',
            text: "Please use a modern one.",
            iconHtml: "?",
            showCancelButton: false,
            confirmButtonText: 'Ok',
            reverseButtons: false
        })
    }
    _showOldBrowserErrorPage(title, desc) {
        this._retryButton = document.querySelector(".button.retry")
        this._body.classList.add("old-browser");
        this._body.querySelector(".wrapper h1").textContent = title;
        this._body.querySelector(".wrapper h4").textContent = desc;
        this._retryButton.style.display = "none";
    }
    _geolocationCoords(locationEvent) {
        const { latitude, longitude } = locationEvent.coords
        return [latitude, longitude]
    }

    _showThemap(coords) {
        try {
            this.#map = L.map('map').setView(coords, 15);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                className: "map_style"
            }).addTo(this.#map);
        } catch (err) {
            this._showMapError.bind(this);
        }
        this._mapDiv.style.backgroundImage = "url('')"
        this.#map.on('click', this._showOptionsOnMapClick.bind(this));
    }

    _showMapError(err) {
        console.log(err)
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
    _showOptionsOnMapClick(mapEvent) {
        const crood = Object.values(mapEvent.latlng);
        const popup = L.popup(crood, {
            content: `<div class="map-menu-wrapper"><div id="map_add_data_btn" class="plus-icon" title="Add new workout."><span class="material-symbols-outlined">
            add
            </span>
            </div> <div id="map_timer_button" class="timer-icon map_timer" title="Timers">
                <span class="workout__icon">⏱</span>
            </div>
            </div>`,
            minWidth: "140",
            closeOnEscapeKey: true
        }).openOn(this.#map);
        this.#mapLatlng = Object.values(mapEvent.latlng);
        const mapoptionevent = new CustomEvent("mapoptionshown")
        this._body.dispatchEvent(mapoptionevent);
    }
    _timerShowHideCallback() {
        this._timerDiv.classList.toggle("hidden");
    }

    _formShowHideCallback(e) {
        e.preventDefault()
        this._formShowHide("running");
    }

    _formShowHide(type, distance, duration, cadence, elevation) {
        this._form.classList.toggle("hidden");
        type ? this._typeInput.value = type.slice(0, 1).toLowerCase() + type.slice(1) : this._typeInput.value = "running"
        distance ? this._distanceInput.value = distance : this._distanceInput.value = ""
        duration ? this._durationInput.value = duration : this._durationInput.value = ""
        cadence ? this._cadenceInput.value = cadence : this._cadenceInput.value = ""
        elevation ? this._elevationInput.value = elevation : this._elevationInput.value = ""
        this._distanceInput.focus();
    }
    _changeThemeCallback(e) {
        this.savedTheme = window.localStorage.getItem("theme") || this.defaultTheme
        this.savedTheme == "dark" ? this.savedTheme = "light" : this.savedTheme = "dark"
        window.localStorage.setItem("theme", this.savedTheme);
        this._setTheme()
    }
    _setTheme() {
        this.savedTheme = window.localStorage.getItem("theme") || this.defaultTheme
        this.savedTheme == "dark" ? this._toggle.checked = false : this._toggle.checked = true
        this._html.setAttribute("data-theme", this.savedTheme)
    }

    _formSubmitCallback(e) {
        e.preventDefault()
        let formValues = [this._typeInput.value, this._distanceInput.value, this._durationInput.value, this._cadenceInput.value, this._elevationInput.value]
        let allValueOk = this._checkInputFeild(...formValues);
        if (allValueOk) {
            if (this.#updateWorkoutDataId) this._updateworkout(this.#updateWorkoutDataId, ...formValues, this.#mapLatlng)
            else this._addWorkout(...formValues, this.#mapLatlng);
            // show data on pagination
            this._paginate.setCurrentPage = this.currentMonth;
            this._paginate.updateData = this._getSavedData().data;
            this._workoutsDiv.dispatchEvent(this._workoutShownEvent);
            this.#updateWorkoutDataId = null;
            this._formShowHide(formValues[0]);
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
        const date = new Date()
        const year = date.getFullYear()
        const month = date.getMonth()
        // const month = this.currentMonth;
        const workout = type == "running" ? new Running(null, mapLatlng, distance, duration, cadence) : new Cycling(null, mapLatlng, distance, duration, elevGain);
        const savedData = this._getSavedData()
            savedData.year ??= year;
            savedData.data ??= [];
            savedData.data[month] ??= {};
            savedData.data[month]['month'] ??= allMonth[month];
            savedData.data[month]["data"] ??= [];
            savedData.data[month]["data"].push(workout);
            this._saveData(savedData);
    }

        _updateworkout(id, type, distance, duration, cadence, elevGain, mapLatlng) {
            const savedData = this._getSavedData();
            const foundIndex = savedData.data[this._paginate.getCurrentPage].data.findIndex(x => x.id == id);
            savedData.data[this._paginate.getCurrentPage].data[foundIndex] = type == "running" ? new Running(id, mapLatlng, distance, duration, cadence) : new Cycling(id, mapLatlng, distance, duration, elevGain);
            this._saveData(savedData);
        }

    _getSavedData() {
        return JSON.parse(window.localStorage.getItem('workoutData')) || this.workout;
    }

    _saveData(data) {
        window.localStorage.setItem("workoutData", JSON.stringify(data));
    }

    _mapMarker(mapLatlngValue, type, dateStr) {
        L.circle(mapLatlngValue, { radius: 30 }).addTo(this.#map);
        L.marker(mapLatlngValue).addTo(this.#map).bindPopup(`${type == "Running" ? '🏃‍♂️' : '🚴‍♀️'} ${type} on ${dateStr}`, { maxWidth: 200, maxHeight: 500, closeButton: false, className: `${type.slice(0, 1).toLowerCase() + type.slice(1)}-popup` }).openPopup()
    }

    _inputTypeCallback(e) {
        e.preventDefault()
        this._changeWorkoutType(e.target.value);
    }
    _changeWorkoutType(type) {
        if (type == "running") {
            this._form.querySelector(".form__input--cadence").parentElement.classList.remove("form__row--hidden")
            this._form.querySelector(".form__input--elevation").parentElement.classList.add("form__row--hidden")
        }
        else if (type == "cycling") {
            this._form.querySelector(".form__input--cadence").parentElement.classList.add("form__row--hidden")
            this._form.querySelector(".form__input--elevation").parentElement.classList.remove("form__row--hidden")
        }
    }
    _workwoutShownCallback() {
        this._moveMapToWorkoutEventHandler()
        this._workoutEditEventHandler();
        this._workoutDeleteEventHandler();
    }

    _moveMapToWorkoutEventHandler() {
        this._workoutsDiv.querySelectorAll("li.workout").forEach(function (elem) {
            elem.addEventListener("click", function (e) {
                const deleteBtn = elem.querySelector(".workout__buttons .delete");
                const editBtn = elem.querySelector(".workout__buttons .edit");
                if (e.target != deleteBtn && e.target != editBtn && !Array.from(deleteBtn.children).includes(e.target) && !Array.from(editBtn.children).includes(e.target)) {
                    e.preventDefault()
                    const savedData = this._getSavedData().data[this._paginate.getCurrentPage].data;
                    const coords = savedData.find(ele => ele.id == elem.attributes[1].value).location
                    this.#map.setView(coords, 15, {
                        animate: true
                    });
                }
            }.bind(this))
        }.bind(this))
    }

    _workoutEdit(ele) {
        const savedData = this._getSavedData().data[this._paginate.getCurrentPage].data;
        const { id, location, type, distance, duration, cadence, elevGain } = savedData.find(el => el.id == ele.attributes[1].value);
        this.#mapLatlng = location;
        this.#updateWorkoutDataId = id;
        this._changeWorkoutType(type.slice(0, 1).toLowerCase() + type.slice(1))
        this._formShowHide(type, distance, duration, cadence, elevGain);
    }

    _workoutEditCallback(e) {
        e.preventDefault()
        const element = e.target.closest("li");
        this.#swalWithBootstrapButtons.fire({
            customClass: {
                confirmButton: 'btn btn-info',
            },
            title: 'Are you sure?',
            text: "You wanna Edit this workout Item.",
            icon: 'question',
            showCancelButton: true,
            cancelButtonText: "No, Cancel",
            confirmButtonText: 'Yes, Edit',
            reverseButtons: false
        }).then((result) => {
            if (result.isConfirmed) this._workoutEdit(element);
        })
    }

    _workoutEditEventHandler() {
        this._workoutsDiv.querySelectorAll(".workout__buttons .edit").forEach(function (ele) {
            ele.addEventListener("click", this._workoutEditCallback.bind(this))
        }.bind(this))
    }

    _workoutDelete(ele) {
        let savedData = this._getSavedData();
       savedData.data[this._paginate.getCurrentPage].data = savedData.data[this._paginate.getCurrentPage].data.filter(el => el.id != ele.attributes[1].value);
       if(!savedData?.data[this._paginate.getCurrentPage]?.data.length>0) {
        savedData.data.splice(this._paginate.getCurrentPage,this._paginate.getCurrentPage)
        }
        let haveNoData = true;
        savedData.data.forEach(ele=>{
            if(ele != null && typeof ele == "object" && ele?.data.length > 0) haveNoData = false;
        })
       if(haveNoData) savedData = null;
       savedData?.data ? this._saveData(savedData) :  window.localStorage.removeItem("workoutData");       
    }

    _workoutDeleteCallback(e) {
        e.preventDefault()
        const element = e.target.closest("li");
        this.#swalWithBootstrapButtons.fire({
            customClass: {
                confirmButton: 'btn btn-danger',
            },
            title: 'Are you sure?',
            text: "You wanna delete this workout Item.",
            icon: 'question',
            showCancelButton: true,
            cancelButtonText: "No, Cancel",
            confirmButtonText: 'Yes, Delete',
            reverseButtons: false
        }).then(async (result) => {
            if (result.isConfirmed) {
                await this._workoutDelete(element);
                await this.#swalWithBootstrapButtons.fire(
                    'Deleted!',
                    'Your file has been deleted.',
                    'success'
                )
                 this._paginate.updateData = await (this._getSavedData().data || []);
            } else {
                this.#swalWithBootstrapButtons.fire(
                    'Cancelled',
                    'Your imaginary data is safe :)',
                    'error'
                )
            }
        })
    }

    _workoutDeleteEventHandler() {
        this._workoutsDiv.querySelectorAll(".workout__buttons .delete").forEach(function (ele) {
            ele.addEventListener("click", this._workoutDeleteCallback.bind(this))
        }.bind(this))
    }
}


// if the user is ofline or online 

class IsOnline {
    _body = document.querySelector("body");
    _retryButton;
    constructor() {
        if (navigator.onLine) {
            new App();
        } else {
            this._showOffline();
        }
        // calling the events
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




// stop watch js 

class Timer {


}

let [milliseconds, seconds, minutes, hours] = [0, 0, 0, 0];
let timerRef = document.querySelector('.timerDisplay');
let currentInterval = null;
document.getElementById('startTimer').addEventListener('click', () => {
    if (currentInterval !== null) {
        clearInterval(currentInterval);
    }
    currentInterval = setInterval(displayTimer, 10);
});
document.getElementById('pauseTimer').addEventListener('click', () => {
    clearInterval(currentInterval);
});
document.getElementById('resetTimer').addEventListener('click', () => {
    clearInterval(currentInterval);
    [milliseconds, seconds, minutes, hours] = [0, 0, 0, 0];
    timerRef.innerHTML = '00 : 00 : 00 : 000 ';
});
function displayTimer() {
    milliseconds += 10;
    if (milliseconds == 1000) {
        milliseconds = 0;
        seconds++;
        if (seconds == 60) {
            seconds = 0;
            minutes++;
            if (minutes == 60) {
                minutes = 0;
                hours++;
            }
        }
    }
    let h = hours < 10 ? "0" + hours : hours;
    let m = minutes < 10 ? "0" + minutes : minutes;
    let s = seconds < 10 ? "0" + seconds : seconds;
    let ms = milliseconds < 10 ? "00" + milliseconds : milliseconds < 100 ? "0" + milliseconds : milliseconds;
    timerRef.innerHTML = ` ${h} : ${m} : ${s} : ${ms}`;
}