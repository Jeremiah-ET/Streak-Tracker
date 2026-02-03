const tasksKey = "streakTasks"
const historyKey = "streakHistory"
const streakKey = "streakNumb"
const lastStreakKey = "lastStreakDay"
const clientKey = "streakClientId"
const syncUpdatedKey = "streakSyncAt"

const loadTasks = () => {
  try {
    const raw = localStorage.getItem(tasksKey)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveTasks = (tasks) => {
  localStorage.setItem(tasksKey, JSON.stringify(tasks))
}

const getClientId = () => {
  const existing = localStorage.getItem(clientKey)
  if (existing) return existing
  const fresh = `client-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
  localStorage.setItem(clientKey, fresh)
  return fresh
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

const syncToServer = async () => {
  try {
    const clientId = getClientId()
    const history = loadHistory()
    const streak = Number(localStorage.getItem(streakKey)) || 0
    await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        streak,
        history,
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
      localStorage.setItem(streakKey, String(data.streak))
    }
    if (Array.isArray(data.history)) {
      localStorage.setItem(historyKey, JSON.stringify(data.history))
    }
    if (Array.isArray(data.tasks)) {
      tasks = data.tasks
      saveTasks(tasks)
    }
    if (typeof data.lastStreakDay === "string") {
      localStorage.setItem(lastStreakKey, data.lastStreakDay)
    }
    localStorage.setItem(syncUpdatedKey, String(Date.now()))
  } catch (err) {
    console.error("Hydrate failed", err)
  }
}

const getTodayKey = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const formatTaskDate = (timestamp) => {
  if (!timestamp) return "Today"
  const date = new Date(timestamp)
  if (Number.isNaN(date.valueOf())) return "Today"
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

const parseDateOnly = (value) => {
  if (!value) return null
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

const getWeekBounds = (date) => {
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = (base.getDay() + 6) % 7
  const start = new Date(base)
  start.setDate(base.getDate() - day)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

let tasks = loadTasks()

const updateTaskStats = () => {
  const total = tasks.length
  const completed = tasks.filter(task => task.done).length
  const open = total - completed
  const today = new Date()
  const { start, end } = getWeekBounds(today)
  const weeklyDone = tasks.filter(task => {
    if (!task.done) return false
    const completedAt = task.completedAt ? new Date(task.completedAt) : null
    if (!completedAt || Number.isNaN(completedAt.valueOf())) return false
    return completedAt >= start && completedAt <= end
  }).length

  const totalNode = document.getElementById("taskTotalValue")
  const completedNode = document.getElementById("taskCompletedValue")
  const openNode = document.getElementById("taskOpenValue")
  const weeklyNode = document.getElementById("taskWeeklyDoneValue")

  if (totalNode) totalNode.textContent = String(total)
  if (completedNode) completedNode.textContent = String(completed)
  if (openNode) openNode.textContent = String(open)
  if (weeklyNode) weeklyNode.textContent = String(weeklyDone)
}

const renderTasks = () => {
  const taskList = document.getElementById("taskList")
  if (!taskList) return
  taskList.innerHTML = ""

  if (!tasks.length) {
    const empty = document.createElement("div")
    empty.className = "taskEmpty"
    empty.textContent = "No tasks yet. Add one to focus today."
    taskList.appendChild(empty)
    updateTaskStats()
    return
  }

  tasks.forEach(task => {
    const row = document.createElement("div")
    const dueDate = task.dueDate ? parseDateOnly(task.dueDate) : null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const isOverdue = !!(dueDate && dueDate < today && !task.done)
    row.className = `taskItem${task.done ? " done" : ""}${isOverdue ? " overdue" : ""}`
    row.dataset.taskId = task.id

    const toggle = document.createElement("button")
    toggle.className = "taskToggle"
    toggle.type = "button"
    toggle.textContent = task.done ? "✓" : ""
    toggle.setAttribute("aria-label", task.done ? "Mark as not done" : "Mark as done")

    const textWrap = document.createElement("div")
    textWrap.className = "taskCopy"

    const text = document.createElement("span")
    text.className = "taskText"
    text.textContent = task.text

    const meta = document.createElement("span")
    meta.className = "taskMeta"
    const dueLabel = task.dueDate ? `Due ${task.dueDate}` : "No due date"
    meta.textContent = `Added ${formatTaskDate(task.createdAt)} · ${dueLabel}`

    const priority = document.createElement("span")
    priority.className = `taskPriority ${task.priority || "medium"}`
    priority.textContent = (task.priority || "medium").toUpperCase()

    textWrap.appendChild(text)
    textWrap.appendChild(meta)
    textWrap.appendChild(priority)

    const remove = document.createElement("button")
    remove.className = "taskRemove"
    remove.type = "button"
    remove.textContent = "Remove"

    row.appendChild(toggle)
    row.appendChild(textWrap)
    row.appendChild(remove)
    taskList.appendChild(row)
  })

  updateTaskStats()
}

const addTask = (value) => {
  const text = value.trim()
  if (!text) return false
  const prioritySelect = document.getElementById("taskPriority")
  const dueInput = document.getElementById("taskDueDate")
  const priority = prioritySelect ? prioritySelect.value : "medium"
  const dueDate = dueInput ? dueInput.value : ""
  const newTask = {
    id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    text,
    done: false,
    createdAt: Date.now(),
    createdDay: getTodayKey(),
    completedAt: null,
    priority,
    dueDate
  }
  tasks.unshift(newTask)
  saveTasks(tasks)
  renderTasks()
  syncToServer()
  return true
}

const toggleTask = (id) => {
  const target = tasks.find(task => task.id === id)
  if (!target) return
  target.done = !target.done
  target.completedAt = target.done ? Date.now() : null
  saveTasks(tasks)
  renderTasks()
  syncToServer()
}

const removeTask = (id) => {
  tasks = tasks.filter(task => task.id !== id)
  saveTasks(tasks)
  renderTasks()
  syncToServer()
}

const clearCompleted = () => {
  tasks = tasks.filter(task => !task.done)
  saveTasks(tasks)
  renderTasks()
  syncToServer()
}

const wireTaskInput = () => {
  const habitInput = document.getElementById("habitInput")
  const submitTask = document.getElementById("submitTask")
  if (!habitInput || !submitTask) return

  const goToTasks = () => {
    if (window.location.pathname.toLowerCase().endsWith("tasks.html")) return
    window.location.href = "Tasks.html"
  }

  submitTask.addEventListener("click", () => {
    const added = addTask(habitInput.value)
    habitInput.value = ""
    const prioritySelect = document.getElementById("taskPriority")
    const dueInput = document.getElementById("taskDueDate")
    if (prioritySelect) prioritySelect.value = "medium"
    if (dueInput) dueInput.value = ""
    if (!added) {
      goToTasks()
      return
    }
    goToTasks()
  })

  habitInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const added = addTask(habitInput.value)
      habitInput.value = ""
      const prioritySelect = document.getElementById("taskPriority")
      const dueInput = document.getElementById("taskDueDate")
      if (prioritySelect) prioritySelect.value = "medium"
      if (dueInput) dueInput.value = ""
      if (added) {
        goToTasks()
      }
    }
  })
}

const wireTaskList = () => {
  const taskList = document.getElementById("taskList")
  if (!taskList) return

  taskList.addEventListener("click", (event) => {
    const button = event.target.closest("button")
    const row = event.target.closest(".taskItem")
    if (!button || !row) return
    const taskId = row.dataset.taskId
    if (!taskId) return

    if (button.classList.contains("taskToggle")) {
      toggleTask(taskId)
      return
    }
    if (button.classList.contains("taskRemove")) {
      removeTask(taskId)
    }
  })
}

const wireClearCompleted = () => {
  const clearButton = document.getElementById("clearCompleted")
  if (!clearButton) return
  clearButton.addEventListener("click", () => {
    clearCompleted()
  })
}

document.addEventListener("DOMContentLoaded", () => {
  hydrateFromServer().finally(() => {
    renderTasks()
  })
  wireTaskInput()
  wireTaskList()
  wireClearCompleted()
})
