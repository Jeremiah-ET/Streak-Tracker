const streakButton = document.getElementById("streakButton")
const mainContainer = document.getElementById("main")
const streakText = document.getElementById("streakText")
const StreakMinusButton = document.getElementById("removeStreak")
const resetStreak = document.getElementById("resetStreak")
const clearAllButton = document.getElementById("clear")

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
})

StreakMinusButton.addEventListener("click", () => {
  streakNumber = Math.max(0, streakNumber - 1)
  upsertHistory(streakHistory, getTodayKey(), streakNumber)
  saveAll()
  updateStreakText()
})

resetStreak.addEventListener("click", () => {
  streakNumber = 0
  streakHistory = []
  saveAll()
  updateStreakText()
})

if (clearAllButton) {
  clearAllButton.addEventListener("click", () => {
    localStorage.clear()
  })
}
