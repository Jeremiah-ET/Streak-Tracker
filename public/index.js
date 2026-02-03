const streakButton = document.getElementById("streakButton")
const mainContainer = document.getElementById("main")
const streakText = document.getElementById("streakText")
const StreakMinusButton = document.getElementById("removeStreak")
const resetStreak = document.getElementById("resetStreak")
const clearAllButton = document.getElementById("clear")
const streak7 = document.getElementById("Streak7")
const streak30 = document.getElementById("Streak30")
const streak60 = document.getElementById("Streak60")

const storageKey = "streakNumb"
const historyKey = "streakHistory"

const getTodayKey = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const loadStreak = () => {
  const stored = Number(localStorage.getItem(storageKey))
  return Number.isFinite(stored) ? stored : 0
}

const loadHistory = () => {
  try {
    const raw = localStorage.getItem(historyKey)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveHistory = (history) => {
  localStorage.setItem(historyKey, JSON.stringify(history))
}

const upsertHistory = (history, dateKey, streakValue) => {
  const index = history.findIndex(entry => entry.date === dateKey)
  if (streakValue <= 0) {
    if (index >= 0) {
      history.splice(index, 1)
    }
    return
  }
  if (index >= 0) {
    history[index].streak = streakValue
  } else {
    history.push({ date: dateKey, streak: streakValue })
  }
}

let streakNumber = loadStreak()
let streakHistory = loadHistory()

const updateStreakText = () => {
  streakText.textContent = `Your current Streak is: ${streakNumber}`
}

const saveStreak = () => {
  localStorage.setItem(storageKey, String(streakNumber))
}

const saveAll = () => {
  saveStreak()
  saveHistory(streakHistory)
}

updateStreakText()

streakButton.addEventListener("click", () => {
  streakNumber += 1
  
if (streakNumber >= 7) {
  streak7.disabled = true;
} 
if (streakNumber >= 30) {
  streak30.disabled = true;
}
if (streakNumber >= 60) {
  streak60.disabled = true;
}
  upsertHistory(streakHistory, getTodayKey(), streakNumber)
  saveAll()
  updateStreakText()
  fetch("/streakCounter", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      streak: streakNumber
    })
    }) .then(res => res.json())
    .then(data => console.log("Success:", data))
    .catch(err => console.error("Error:", err))

    getStreak7()
    getStreak30()
    getStreak60()
})

StreakMinusButton.addEventListener("click", () => {
  streakNumber = Math.max(0, streakNumber - 1)
  if (streakNumber < 7) {
  streak7.disabled = false;
} 
if (streakNumber < 30) {
  streak30.disabled = false;
}
if (streakNumber < 60) {
  streak60.disabled = false;
}
  upsertHistory(streakHistory, getTodayKey(), streakNumber)
  saveAll()
  updateStreakText()
  getStreak7()
  getStreak30()
  getStreak60()
})

resetStreak.addEventListener("click", () => {
  streakNumber = 0
  streakHistory = []
  saveAll()
  updateStreakText()
  streak7.disabled = false;
  streak30.disabled = false;
  streak60.disabled = false;

  getStreak7()
  getStreak30()
  getStreak60()
})

if (clearAllButton) {
  clearAllButton.addEventListener("click", () => {
    localStorage.clear()
  })
}

function getStreak7() {
  if (streakNumber >= 7) {
    streak7.textContent = "You have reached a streak of 7";
  } else if (streakNumber < 7) {
    streak7.textContent ="Streak 7 || Get 7 or higher to reach"
  }
}
function getStreak30() {
  if (streakNumber >= 30) {
    streak30.textContent = "You have reached a streak of 30";
  } else if (streakNumber < 30) {
    streak30.textContent ="Streak 30 || Get 30 or higher to reach"
  }
}
function getStreak60() {
  if (streakNumber >= 60) {
    streak60.textContent = "You have reached a streak of 60";
  } else if (streakNumber < 60) {
    streak60.textContent ="Streak 60 || Get 60 or higher to reach"
  }
}

