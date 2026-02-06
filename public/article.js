const streakNumber = "streakNumb"
const streaktag = document.getElementById("streaktag")

streaktag.textContent = localStorage.getItem(streakNumber) ? "Your Streak is: " + localStorage.getItem(streakNumber) : "Start a streak"