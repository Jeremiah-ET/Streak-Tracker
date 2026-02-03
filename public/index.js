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
const lastStreakKey = "lastStreakDay"
const tasksKey = "streakTasks"
const clientKey = "streakClientId"
const syncUpdatedKey = "streakSyncAt"

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

const loadTasks = () => {
  try {
    const raw = localStorage.getItem(tasksKey)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const getClientId = () => {
  const existing = localStorage.getItem(clientKey)
  if (existing) return existing
  const fresh = `client-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
  localStorage.setItem(clientKey, fresh)
  return fresh
}

const syncToServer = async () => {
  try {
    const clientId = getClientId()
    const tasks = loadTasks()
    await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        streak: streakNumber,
        history: streakHistory,
        tasks,
        lastStreakDay: localStorage.getItem(lastStreakKey)
      })
    })
    localStorage.setItem(syncUpdatedKey, String(Date.now()))
  } catch (err) {
    console.error("Sync failed", err)
  }
}

const hydrateFromServer = async () => {
  try {
    const clientId = getClientId()
    const response = await fetch(`/api/sync?clientId=${encodeURIComponent(clientId)}`)
    if (!response.ok) return
    const data = await response.json()
    if (!data || !data.clientId) return

    const localSync = Number(localStorage.getItem(syncUpdatedKey)) || 0
    const serverSync = data.updatedAt ? Date.parse(data.updatedAt) : 0
    if (serverSync && serverSync <= localSync) return

    if (typeof data.streak === "number") {
      streakNumber = data.streak
      localStorage.setItem(storageKey, String(data.streak))
    }
    if (Array.isArray(data.history)) {
      streakHistory = data.history
      saveHistory(streakHistory)
    }
    if (Array.isArray(data.tasks)) {
      localStorage.setItem(tasksKey, JSON.stringify(data.tasks))
    }
    if (typeof data.lastStreakDay === "string") {
      localStorage.setItem(lastStreakKey, data.lastStreakDay)
    }
    localStorage.setItem(syncUpdatedKey, String(Date.now()))
    updateStreakText()
    updateDailyLock()
  } catch (err) {
    console.error("Hydrate failed", err)
  }
}

const updateDailyLock = () => {
  const todayKey = getTodayKey()
  const lastLogged = localStorage.getItem(lastStreakKey)
  if (lastLogged === todayKey) {
    streakButton.disabled = true
  } else {
    streakButton.disabled = false
  }
}

updateDailyLock()
hydrateFromServer()

streakButton.addEventListener("click", () => {
  const todayKey = getTodayKey()
  if (localStorage.getItem(lastStreakKey) === todayKey) {
    updateDailyLock()
    return
  }
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
  localStorage.setItem(lastStreakKey, todayKey)
  saveAll()
  updateStreakText()
  updateDailyLock()
  syncToServer()

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
  localStorage.removeItem(lastStreakKey)
  updateStreakText()
  updateDailyLock()
  syncToServer()
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
    updateDailyLock()
    syncToServer()
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
