const streakButton = document.getElementById("streakButton")
const mainContainer = document.getElementById("main")
const streakText = document.getElementById("streakText")
const StreakMinusButton = document.getElementById("removeStreak")
const resetStreak = document.getElementById("resetStreak")
const clearAllButton = document.getElementById("clear")

let streakNumber = 0;
localStorage("streakNumb", streakNumber)
streakButton.addEventListener("click", (e) => {
  console.log(`Streak Added: ${streakNumber}`)
  streakNumber += 1;
  localStorage.getItem("streakNumb");
  streakText.textContent = `Your current Streak is: ${"streakNumb"}`
  fetch("/streakCounter", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      streak: streakNumber
    })
    }) .then(res => res.json())
    .then(data => console.log("Success:", data))
    .catch(err => console.error("Error:", err))
    
  })

StreakMinusButton.addEventListener("click", (e)=> {
  streakNumber -= 1;
  streakText.textContent = `Your current Streak is: ${streakNumber}`
  if (streakNumber < 0) {
    streakNumber = 0
    streakText.textContent = `Your current Streak is: ${streakNumber} | Cant go into negative streak`
  }
})
resetStreak.addEventListener("click", (e)=> {
  streakNumber = 0;
  streakText.textContent = `Your current Streak is: ${streakNumber}`
})

clearAllButton.addEventListener("click", (e)=> {
  localStorage.clear()
})