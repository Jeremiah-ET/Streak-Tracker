const streakButton = document.getElementById("streakButton")
const mainContainer = document.getElementById("main")
const streakText = document.getElementById("streakText")
const StreakMinusButton = document.getElementById("removeStreak")
const resetStreak = document.getElementById("resetStreak")

let streakNumber = 0;

streakButton.addEventListener("click", (e) => {
  console.log(`Streak Added: ${streakNumber}`)
  streakNumber += 1;
  streakText.textContent = `Your current Streak is: ${streakNumber}`
  mainContainer.appendChild(streakDeclaration);
  // need to add limit on how many times when pressed
  // if (streakDeclaration.value = !0) {}
  
})