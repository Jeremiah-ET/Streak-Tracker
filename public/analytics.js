const streakKey = "streakNumb"
const historyKey = "streakHistory"
const tasksKey = "streakTasks"
const lastStreakKey = "lastStreakDay"
const clientKey = "streakClientId"
const syncUpdatedKey = "streakSyncAt"

const getTodayKey = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
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

const getClientId = () => {
  const existing = localStorage.getItem(clientKey)
  if (existing) return existing
  const fresh = `client-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
  localStorage.setItem(clientKey, fresh)
  return fresh
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
      localStorage.setItem(streakKey, String(data.streak))
    }
    if (Array.isArray(data.history)) {
      localStorage.setItem(historyKey, JSON.stringify(data.history))
    }
    if (Array.isArray(data.tasks)) {
      localStorage.setItem(tasksKey, JSON.stringify(data.tasks))
    }
    if (typeof data.lastStreakDay === "string") {
      localStorage.setItem(lastStreakKey, data.lastStreakDay)
    }
    localStorage.setItem(syncUpdatedKey, String(Date.now()))
  } catch (err) {
    console.error("Hydrate failed", err)
  }
}

const parseDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number)
  return new Date(year, month - 1, day)
}

const formatDate = (dateKey) => {
  const date = parseDateKey(dateKey)
  if (Number.isNaN(date.valueOf())) {
    return "No data yet"
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

const getAnalytics = (history) => {
  const currentStreak = Number(localStorage.getItem(streakKey)) || 0
  const totalDays = history.length
  let bestStreak = 0
  let bestDate = null
  let streakSum = 0

  history.forEach(entry => {
    const streakValue = Number(entry.streak) || 0
    streakSum += streakValue
    if (streakValue > bestStreak) {
      bestStreak = streakValue
      bestDate = entry.date
    }
  })

  const today = parseDateKey(getTodayKey())
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 6)

  const weeklyCount = history.filter(entry => {
    const entryDate = parseDateKey(entry.date)
    return entryDate >= weekAgo && entryDate <= today
  }).length

  const averageStreak = totalDays ? Math.round(streakSum / totalDays) : 0

  return {
    currentStreak,
    totalDays,
    bestStreak,
    bestDate,
    weeklyCount,
    averageStreak
  }
}

const setText = (id, value) => {
  const node = document.getElementById(id)
  if (node) {
    node.textContent = value
  }
}

const updateCounterPage = () => {
  const history = loadHistory()
  const analytics = getAnalytics(history)

  setText("currentStreakValue", `${analytics.currentStreak} days`)
  setText("weeklyDelta", `${analytics.weeklyCount} days logged this week`)
  setText("bestStreakValue", `${analytics.bestStreak} days`)
  setText("bestStreakDate", analytics.bestDate ? `Reached on ${formatDate(analytics.bestDate)}` : "No data yet")
  setText("totalDaysValue", String(analytics.totalDays))
  setText("weeklyTargetValue", `${analytics.weeklyCount} / 7`)
  setText("averageStreakValue", `${analytics.averageStreak} days`)
}

const buildCalendar = (history) => {
  const grid = document.getElementById("calendarGrid")
  if (!grid) return

  const completedDates = new Set(history.map(entry => entry.date))
  const today = new Date()
  const todayKey = getTodayKey()
  const year = today.getFullYear()
  const month = today.getMonth()

  const firstDay = new Date(year, month, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  for (let i = 0; i < startOffset; i += 1) {
    const day = prevMonthDays - startOffset + i + 1
    const chip = document.createElement("div")
    chip.className = "dayChip muted"
    chip.textContent = day
    grid.appendChild(chip)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const chip = document.createElement("div")
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    chip.className = "dayChip"
    if (dateKey === todayKey) {
      chip.classList.add("today")
    }
    if (completedDates.has(dateKey)) {
      chip.classList.add("completed")
    }
    chip.textContent = day
    grid.appendChild(chip)
  }
}

const runAnalytics = async () => {
  await hydrateFromServer()
  const history = loadHistory()
  if (document.getElementById("currentStreakValue")) {
    updateCounterPage()
  }
  buildCalendar(history)
}

document.addEventListener("DOMContentLoaded", () => {
  runAnalytics()
})
