/* ============================================================
   TaskBloom — Complete JavaScript
   ============================================================ */

/* ── Motivational Quotes ── */
const QUOTES_FEMALE = [
  "You can do it, beautiful 💖",
  "Keep going love, you're amazing ✨",
  "She believed she could, so she did 🌸",
  "Your potential is endless, queen 👑",
  "Every task you complete is a victory 🎀",
  "You are capable of incredible things 🌺",
  "Bloom where you are planted 🌷",
  "Small steps still move you forward, gorgeous ✨",
];
const QUOTES_MALE = [
  "You got this king 💙",
  "Stay strong champ 🚗",
  "Champions push through every day 🏆",
  "One task at a time, legend 💪",
  "Discipline beats motivation every time ⚡",
  "Execute. Elevate. Dominate. 🔥",
  "Built different. Work different. 💎",
  "The grind never stops for a king 👑",
];
const QUOTES_NEUTRAL = [
  "One step at a time ✨",
  "Progress, not perfection 🌟",
  "You are doing great, keep going! 💪",
  "Every completed task is a win 🏆",
];

/* ── Category Meta ── */
const CAT_META = {
  study:    { emoji: "📚", label: "Study",    color: "#6366f1" },
  work:     { emoji: "💼", label: "Work",     color: "#10b981" },
  personal: { emoji: "🧘", label: "Personal", color: "#ec4899" },
  health:   { emoji: "🏃", label: "Health",   color: "#22c55e" },
  other:    { emoji: "✨", label: "Other",    color: "#f59e0b" },
};

/* ── State ── */
let currentUser = null;    // { name, email, password, gender }
let tasks       = [];      // array of task objects
let editingId   = null;    // id of task being edited
let quoteIdx    = 0;
let quoteTimer  = null;
let notifTimer  = null;
let particleEmojis = ["💖"];

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("tb_session");
  if (saved) {
    currentUser = JSON.parse(saved);
    enterDashboard();
  } else {
    initParticles(null);
  }
  // Request notification permission
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
});

/* ============================================================
   AUTH HELPERS
   ============================================================ */
function showPage(pageId) {
  document.querySelectorAll(".auth-page").forEach(p => p.classList.remove("active-auth"));
  document.getElementById(pageId).classList.add("active-auth");
}

function togglePassword(inputId, btn) {
  const inp = document.getElementById(inputId);
  const ico = btn.querySelector("i");
  if (inp.type === "password") {
    inp.type = "text";
    ico.className = "fa fa-eye-slash";
  } else {
    inp.type = "password";
    ico.className = "fa fa-eye";
  }
}

function selectGender(g) {
  document.getElementById("gender-male-label").classList.remove("selected");
  document.getElementById("gender-female-label").classList.remove("selected");
  document.getElementById(`gender-${g}-label`).classList.add("selected");
}

function getUsers() {
  return JSON.parse(localStorage.getItem("tb_users") || "[]");
}
function saveUsers(arr) {
  localStorage.setItem("tb_users", JSON.stringify(arr));
}

/* ── Register ── */
function registerUser() {
  const name     = document.getElementById("reg-name").value.trim();
  const email    = document.getElementById("reg-email").value.trim().toLowerCase();
  const password = document.getElementById("reg-password").value;
  const gender   = document.querySelector("input[name='gender']:checked")?.value;
  const errEl    = document.getElementById("reg-error");

  if (!name)        { showError(errEl, "Please enter your name."); return; }
  if (!email || !email.includes("@")) { showError(errEl, "Enter a valid email."); return; }
  if (password.length < 6) { showError(errEl, "Password must be at least 6 characters."); return; }
  if (!gender)      { showError(errEl, "Please select your gender."); return; }

  const users = getUsers();
  if (users.find(u => u.email === email)) {
    showError(errEl, "An account with this email already exists.");
    return;
  }

  const user = { name, email, password, gender };
  users.push(user);
  saveUsers(users);

  // Auto-login
  currentUser = user;
  localStorage.setItem("tb_session", JSON.stringify(user));
  hideError(errEl);
  enterDashboard();
}

/* ── Login ── */
function loginUser() {
  const email    = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;
  const errEl    = document.getElementById("login-error");

  if (!email || !password) { showError(errEl, "Please fill in all fields."); return; }

  const users = getUsers();
  const user  = users.find(u => u.email === email && u.password === password);
  if (!user) { showError(errEl, "Invalid email or password."); return; }

  currentUser = user;
  localStorage.setItem("tb_session", JSON.stringify(user));
  hideError(errEl);
  enterDashboard();
}

/* ── Logout ── */
function logoutUser() {
  clearInterval(quoteTimer);
  clearInterval(notifTimer);
  localStorage.removeItem("tb_session");
  currentUser = null;
  tasks = [];
  editingId = null;

  document.getElementById("dashboard-section").classList.add("hidden");
  document.getElementById("auth-section").classList.remove("hidden");
  document.body.className = "theme-neutral";
  document.body.setAttribute("data-theme", "light");
  showPage("login-page");
  initParticles(null);
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove("hidden");
}
function hideError(el) {
  el.classList.add("hidden");
}

/* ============================================================
   ENTER DASHBOARD
   ============================================================ */
function enterDashboard() {
  // Apply theme
  const gender = currentUser.gender;
  document.body.className = gender === "female" ? "theme-female" : "theme-male";
  const savedTheme = localStorage.getItem("tb_theme") || "light";
  document.body.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);

  // Load tasks
  tasks = JSON.parse(localStorage.getItem(`tb_tasks_${currentUser.email}`) || "[]");

  // Swap sections
  document.getElementById("auth-section").classList.add("hidden");
  document.getElementById("dashboard-section").classList.remove("hidden");

  // Sidebar user info
  document.getElementById("sb-name").textContent  = currentUser.name;
  document.getElementById("sb-email").textContent = currentUser.email;
  const initial = currentUser.name.charAt(0).toUpperCase();
  document.getElementById("sb-avatar").textContent    = initial;
  document.getElementById("topbar-avatar").textContent = initial;

  // Greeting & quote
  setGreeting();
  startQuoteRotation();

  // Particles
  initParticles(gender);

  // Render
  renderAll();
  showSection("overview");

  // Start notification polling
  startNotifPolling();

  // Add sidebar overlay element if missing
  if (!document.getElementById("sidebar-overlay")) {
    const ov = document.createElement("div");
    ov.id = "sidebar-overlay";
    ov.onclick = () => closeSidebar();
    document.body.appendChild(ov);
  }
}

/* ── Greeting ── */
function setGreeting() {
  const h   = new Date().getHours();
  const tod = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  document.getElementById("greeting-text").textContent =
    `${tod}, ${currentUser.name.split(" ")[0]}! 👋`;
}

/* ── Quotes ── */
function startQuoteRotation() {
  const quotes = getQuotes();
  quoteIdx = 0;
  setQuote(quotes[quoteIdx]);
  clearInterval(quoteTimer);
  quoteTimer = setInterval(() => {
    quoteIdx = (quoteIdx + 1) % quotes.length;
    setQuote(quotes[quoteIdx]);
  }, 5000);
}
function getQuotes() {
  if (currentUser.gender === "female") return QUOTES_FEMALE;
  if (currentUser.gender === "male")   return QUOTES_MALE;
  return QUOTES_NEUTRAL;
}
function setQuote(q) {
  const el = document.getElementById("motivational-quote");
  el.style.opacity = "0";
  setTimeout(() => {
    el.textContent = q;
    el.style.opacity = "1";
    el.style.transition = "opacity 0.6s";
  }, 300);
}

/* ============================================================
   PARTICLES
   ============================================================ */
function initParticles(gender) {
  const container = document.getElementById("particles-container");
  container.innerHTML = "";

  let emojis;
  if (gender === "female") emojis = ["💖", "🌸", "✨", "🌷", "💕"];
  else if (gender === "male") emojis = ["🚗", "💙", "⚡", "🏆", "💎"];
  else emojis = ["✨", "🌟", "💫"];

  for (let i = 0; i < 18; i++) {
    const p = document.createElement("span");
    p.className = "particle";
    p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    const left  = Math.random() * 100;
    const dur   = 8 + Math.random() * 12;
    const delay = -Math.random() * 15;
    const size  = 1 + Math.random() * 0.8;
    p.style.cssText = `left:${left}%;font-size:${size}rem;animation-duration:${dur}s;animation-delay:${delay}s;`;
    container.appendChild(p);
  }
}

/* ============================================================
   THEME
   ============================================================ */
function toggleTheme() {
  const current = document.body.getAttribute("data-theme");
  const next    = current === "dark" ? "light" : "dark";
  document.body.setAttribute("data-theme", next);
  localStorage.setItem("tb_theme", next);
  updateThemeIcon(next);
}
function updateThemeIcon(theme) {
  const ico   = document.getElementById("theme-icon");
  const label = document.getElementById("theme-label");
  if (!ico) return;
  if (theme === "dark") {
    ico.className  = "fa fa-sun";
    label.textContent = "Light Mode";
  } else {
    ico.className  = "fa fa-moon";
    label.textContent = "Dark Mode";
  }
}

/* ============================================================
   SIDEBAR / NAV
   ============================================================ */
function showSection(name) {
  document.querySelectorAll(".content-section").forEach(s => s.classList.remove("active-section"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  document.getElementById(`section-${name}`).classList.add("active-section");
  document.querySelector(`.nav-item[data-section="${name}"]`)?.classList.add("active");

  // Render the relevant section
  if (name === "overview")   renderOverview();
  if (name === "tasks")      renderAllTasks();
  if (name === "important")  renderImportant();
  if (name === "upcoming")   renderUpcoming();
  if (name === "completed")  renderCompleted();
  if (name === "categories") renderCategories();

  closeSidebar();
}

function toggleSidebar() {
  const sb = document.getElementById("sidebar");
  const ov = document.getElementById("sidebar-overlay");
  sb.classList.toggle("open");
  ov?.classList.toggle("active");
}
function closeSidebar() {
  document.getElementById("sidebar")?.classList.remove("open");
  document.getElementById("sidebar-overlay")?.classList.remove("active");
}

/* ============================================================
   TASK STORAGE
   ============================================================ */
function saveTasks() {
  localStorage.setItem(`tb_tasks_${currentUser.email}`, JSON.stringify(tasks));
}

/* ============================================================
   TASK MODAL
   ============================================================ */
function openTaskModal(id = null) {
  editingId = id;
  const modal = document.getElementById("task-modal");
  const title = document.getElementById("modal-title");

  // Clear form
  document.getElementById("task-title").value    = "";
  document.getElementById("task-desc").value     = "";
  document.getElementById("task-category").value = "study";
  document.getElementById("task-priority").value = "low";
  document.getElementById("task-date").value     = "";
  document.getElementById("task-time").value     = "";
  document.getElementById("task-star").checked   = false;
  hideError(document.getElementById("modal-error"));

  if (id !== null) {
    const t = tasks.find(x => x.id === id);
    if (t) {
      title.textContent = "Edit Task";
      document.getElementById("task-title").value    = t.title;
      document.getElementById("task-desc").value     = t.desc;
      document.getElementById("task-category").value = t.category;
      document.getElementById("task-priority").value = t.priority;
      document.getElementById("task-date").value     = t.date;
      document.getElementById("task-time").value     = t.time;
      document.getElementById("task-star").checked   = t.starred;
    }
  } else {
    title.textContent = "New Task";
  }

  modal.classList.remove("hidden");
  document.getElementById("task-title").focus();
}

function closeTaskModal() {
  document.getElementById("task-modal").classList.add("hidden");
  editingId = null;
}

function saveTask() {
  const titleVal = document.getElementById("task-title").value.trim();
  const errEl    = document.getElementById("modal-error");

  if (!titleVal) { showError(errEl, "Task title is required."); return; }

  if (editingId !== null) {
    // Edit
    const idx = tasks.findIndex(t => t.id === editingId);
    if (idx !== -1) {
      tasks[idx] = {
        ...tasks[idx],
        title:    titleVal,
        desc:     document.getElementById("task-desc").value.trim(),
        category: document.getElementById("task-category").value,
        priority: document.getElementById("task-priority").value,
        date:     document.getElementById("task-date").value,
        time:     document.getElementById("task-time").value,
        starred:  document.getElementById("task-star").checked,
      };
    }
    showToast("Task updated! ✏️", "info");
  } else {
    // New
    const task = {
      id:        Date.now(),
      title:     titleVal,
      desc:      document.getElementById("task-desc").value.trim(),
      category:  document.getElementById("task-category").value,
      priority:  document.getElementById("task-priority").value,
      date:      document.getElementById("task-date").value,
      time:      document.getElementById("task-time").value,
      starred:   document.getElementById("task-star").checked,
      completed: false,
      createdAt: Date.now(),
    };
    tasks.unshift(task);
    showToast("Task added! 🎯", "success");
  }

  saveTasks();
  closeTaskModal();
  renderAll();
}

/* ── Close modal on overlay click ── */
document.addEventListener("click", e => {
  const overlay = document.getElementById("task-modal");
  if (e.target === overlay) closeTaskModal();
});

/* ============================================================
   TASK ACTIONS
   ============================================================ */
function toggleComplete(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  t.completed = !t.completed;
  saveTasks();
  renderAll();
  if (t.completed) {
    showToast("Task completed! 🎉", "success");
    launchConfetti();
  } else {
    showToast("Task re-opened!", "info");
  }
}

function toggleStar(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  t.starred = !t.starred;
  saveTasks();
  renderAll();
  showToast(t.starred ? "Marked as important ⭐" : "Removed from important", "info");
}

function deleteTask(id) {
  if (!confirm("Delete this task?")) return;
  tasks = tasks.filter(x => x.id !== id);
  saveTasks();
  renderAll();
  showToast("Task deleted 🗑️", "error");
}

function clearCompleted() {
  if (!tasks.some(t => t.completed)) { showToast("No completed tasks to clear!", "info"); return; }
  if (!confirm("Clear all completed tasks?")) return;
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  renderAll();
  showToast("Cleared all completed tasks ✓", "success");
}

/* ============================================================
   SEARCH
   ============================================================ */
function searchTasks() {
  const q = document.getElementById("search-input").value.toLowerCase().trim();
  if (!q) { renderAll(); return; }

  const results = tasks.filter(t =>
    t.title.toLowerCase().includes(q) ||
    t.desc.toLowerCase().includes(q) ||
    t.category.toLowerCase().includes(q)
  );

  // Show results in all-tasks section
  showSection("tasks");
  const list = document.getElementById("all-tasks-list");
  if (results.length === 0) {
    list.innerHTML = emptyState("🔍", "No results", `Nothing found for "${q}"`);
  } else {
    list.innerHTML = results.map(buildTaskCard).join("");
  }
}

/* ============================================================
   RENDER ALL
   ============================================================ */
function renderAll() {
  updateStats();
  renderOverview();
  renderAllTasks();
  renderImportant();
  renderUpcoming();
  renderCompleted();
  renderCategories();
}

/* ── Stats ── */
function updateStats() {
  const total     = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending   = total - completed;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

  document.getElementById("stat-total").textContent     = total;
  document.getElementById("stat-completed").textContent = completed;
  document.getElementById("stat-pending").textContent   = pending;
  document.getElementById("stat-percent").textContent   = `${pct}%`;
  document.getElementById("progress-fill").style.width  = `${pct}%`;
  document.getElementById("progress-label").textContent = `${completed} / ${total} tasks`;

  // Notification badge — overdue tasks
  const now = new Date();
  const overdue = tasks.filter(t => !t.completed && t.date && new Date(t.date) < now).length;
  const badge   = document.getElementById("notif-badge");
  if (overdue > 0) {
    badge.textContent = overdue;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

/* ── Overview ── */
function renderOverview() {
  updateStats();

  // Important mini list
  const imp = tasks.filter(t => t.starred && !t.completed).slice(0, 5);
  renderMiniList("overview-important", imp);

  // Upcoming mini list (next 7 days, incomplete)
  const today = new Date(); today.setHours(0,0,0,0);
  const week  = new Date(today); week.setDate(week.getDate() + 7);
  const upcoming = tasks
    .filter(t => !t.completed && t.date && new Date(t.date) >= today && new Date(t.date) <= week)
    .sort((a,b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);
  renderMiniList("overview-upcoming", upcoming);

  // Recent tasks (first 5)
  const recent = tasks.slice(0, 5);
  const rList  = document.getElementById("overview-recent");
  rList.innerHTML = recent.length
    ? recent.map(buildTaskCard).join("")
    : emptyState("🌱", "No tasks yet", "Add your first task to get started!");
}

function renderMiniList(elId, arr) {
  const el = document.getElementById(elId);
  if (!arr.length) {
    el.innerHTML = `<div class="mini-empty">Nothing here yet ✨</div>`;
    return;
  }
  el.innerHTML = arr.map(t => `
    <div class="task-mini-item">
      <span class="mini-dot ${priorityClass(t.priority)}"></span>
      <span class="mini-title">${esc(t.title)}</span>
      ${t.date ? `<span class="mini-date">${fmtDate(t.date)}</span>` : ""}
    </div>
  `).join("");
}

/* ── All Tasks ── */
function renderAllTasks() {
  const cat  = document.getElementById("filter-category")?.value || "all";
  const sort = document.getElementById("sort-tasks")?.value || "newest";
  const q    = document.getElementById("search-input")?.value.toLowerCase() || "";

  let list = [...tasks];

  if (cat !== "all") list = list.filter(t => t.category === cat);
  if (q)             list = list.filter(t => t.title.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q));

  list = sortTasks(list, sort);

  const el = document.getElementById("all-tasks-list");
  el.innerHTML = list.length
    ? list.map(buildTaskCard).join("")
    : emptyState("📋", "No tasks", "Add a new task to get started!");
}

/* ── Important ── */
function renderImportant() {
  const imp = tasks.filter(t => t.starred);
  const el  = document.getElementById("important-tasks-list");
  el.innerHTML = imp.length
    ? imp.map(buildTaskCard).join("")
    : emptyState("⭐", "No important tasks", "Star a task to see it here.");
}

/* ── Upcoming ── */
function renderUpcoming() {
  const today = new Date(); today.setHours(0,0,0,0);
  const list  = tasks
    .filter(t => !t.completed && t.date && new Date(t.date) >= today)
    .sort((a,b) => new Date(a.date) - new Date(b.date));
  const el = document.getElementById("upcoming-tasks-list");
  el.innerHTML = list.length
    ? list.map(buildTaskCard).join("")
    : emptyState("🗓️", "Nothing upcoming", "No tasks scheduled ahead.");
}

/* ── Completed ── */
function renderCompleted() {
  const done = tasks.filter(t => t.completed);
  const el   = document.getElementById("completed-tasks-list");
  el.innerHTML = done.length
    ? done.map(buildTaskCard).join("")
    : emptyState("✅", "Nothing completed yet", "Complete a task to see it here!");
}

/* ── Categories ── */
function renderCategories() {
  const grid = document.getElementById("categories-grid");
  grid.innerHTML = Object.entries(CAT_META).map(([key, meta]) => {
    const total     = tasks.filter(t => t.category === key).length;
    const completed = tasks.filter(t => t.category === key && t.completed).length;
    return `
      <div class="category-card" onclick="filterByCategory('${key}')">
        <div class="cat-emoji">${meta.emoji}</div>
        <div class="cat-name">${meta.label}</div>
        <div class="cat-count">${completed}/${total} tasks</div>
        ${total > 0 ? `
          <div class="progress-track" style="margin-top:0.75rem;height:6px;">
            <div class="progress-fill" style="width:${total?Math.round(completed/total*100):0}%;background:${meta.color};"></div>
          </div>` : ""}
      </div>
    `;
  }).join("");
}

function filterByCategory(cat) {
  showSection("tasks");
  document.getElementById("filter-category").value = cat;
  renderAllTasks();
}

/* ============================================================
   TASK CARD BUILDER
   ============================================================ */
function buildTaskCard(t) {
  const overdue  = t.date && !t.completed && new Date(t.date) < new Date();
  const catMeta  = CAT_META[t.category] || CAT_META.other;
  const dateChip = t.date
    ? `<span class="meta-chip ${overdue ? "overdue" : "date"}">
         <i class="fa fa-calendar"></i> ${fmtDate(t.date)}${t.time ? " " + fmtTime(t.time) : ""}
       </span>`
    : "";

  return `
    <div class="task-card ${t.completed ? "completed-card" : ""}" data-priority="${t.priority}" data-id="${t.id}">
      <button class="task-check ${t.completed ? "checked" : ""}"
              onclick="toggleComplete(${t.id})"
              title="${t.completed ? "Mark incomplete" : "Mark complete"}">
        ${t.completed ? '<i class="fa fa-check"></i>' : ""}
      </button>
      <div class="task-body">
        <div class="task-title">
          <span class="priority-dot ${priorityClass(t.priority)}"></span>
          ${esc(t.title)}
          ${t.starred ? '<i class="fa fa-star title-star"></i>' : ""}
        </div>
        ${t.desc ? `<div class="task-desc">${esc(t.desc)}</div>` : ""}
        <div class="task-meta">
          <span class="meta-chip cat-${t.category}">${catMeta.emoji} ${catMeta.label}</span>
          <span class="meta-chip" style="background:rgba(0,0,0,0.04)">${priorityLabel(t.priority)}</span>
          ${dateChip}
        </div>
      </div>
      <div class="task-actions">
        <button class="action-btn star ${t.starred ? "active" : ""}"
                onclick="toggleStar(${t.id})" title="${t.starred ? "Unstar" : "Star"}">
          <i class="fa fa-star"></i>
        </button>
        <button class="action-btn" onclick="openTaskModal(${t.id})" title="Edit">
          <i class="fa fa-pen"></i>
        </button>
        <button class="action-btn delete" onclick="deleteTask(${t.id})" title="Delete">
          <i class="fa fa-trash"></i>
        </button>
      </div>
    </div>
  `;
}

/* ============================================================
   HELPERS
   ============================================================ */
function sortTasks(arr, mode) {
  const copy = [...arr];
  switch (mode) {
    case "oldest":   return copy.sort((a,b) => a.createdAt - b.createdAt);
    case "due-asc":  return copy.sort((a,b) => (a.date||"z").localeCompare(b.date||"z"));
    case "due-desc": return copy.sort((a,b) => (b.date||"").localeCompare(a.date||""));
    case "priority": {
      const rank = { high:0, medium:1, low:2 };
      return copy.sort((a,b) => (rank[a.priority]||2) - (rank[b.priority]||2));
    }
    default: return copy.sort((a,b) => b.createdAt - a.createdAt);
  }
}

function priorityClass(p) {
  return p === "high" ? "p-high" : p === "medium" ? "p-medium" : "p-low";
}
function priorityLabel(p) {
  return p === "high" ? "🔴 High" : p === "medium" ? "🟡 Medium" : "🟢 Low";
}

function fmtDate(d) {
  if (!d) return "";
  const [y,m,day] = d.split("-");
  return `${day}/${m}/${y}`;
}
function fmtTime(t) {
  if (!t) return "";
  const [h,min] = t.split(":");
  const hr = parseInt(h);
  return `${hr % 12 || 12}:${min} ${hr >= 12 ? "PM" : "AM"}`;
}

function esc(s) {
  return String(s)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");
}

function emptyState(emoji, heading, sub) {
  return `<div class="empty-state">
    <div class="empty-emoji">${emoji}</div>
    <h3>${heading}</h3>
    <p>${sub}</p>
  </div>`;
}

/* ============================================================
   NOTIFICATIONS
   ============================================================ */
function startNotifPolling() {
  clearInterval(notifTimer);
  notifTimer = setInterval(checkNotifications, 60 * 1000); // every minute
  checkNotifications(); // immediate
}

function checkNotifications() {
  if (!currentUser) return;
  const now     = new Date();
  const soon    = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour ahead

  tasks.forEach(t => {
    if (t.completed || !t.date) return;
    const due = new Date(`${t.date}T${t.time || "23:59"}`);
    if (due > now && due <= soon) {
      sendBrowserNotif(`⏰ Due soon: ${t.title}`, `Due at ${fmtTime(t.time || "23:59")} today!`);
      showToast(`⏰ "${t.title}" is due soon!`, "warning");
    }
  });

  // Overdue
  const overdue = tasks.filter(t => !t.completed && t.date && new Date(`${t.date}T${t.time||"23:59"}`) < now);
  if (overdue.length > 0) {
    const badge = document.getElementById("notif-badge");
    badge.textContent = overdue.length;
    badge.classList.remove("hidden");
  }
}

function sendBrowserNotif(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "🌸" });
  }
}

/* ============================================================
   CONFETTI
   ============================================================ */
function launchConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  canvas.classList.remove("hidden");
  const ctx = canvas.getContext("2d");
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = Array.from({ length: 120 }, () => ({
    x:    Math.random() * canvas.width,
    y:    -10 - Math.random() * 100,
    r:    4 + Math.random() * 6,
    color: `hsl(${Math.random()*360},80%,60%)`,
    vx:   (Math.random() - 0.5) * 4,
    vy:   3 + Math.random() * 4,
    rot:  Math.random() * 360,
    vr:   (Math.random() - 0.5) * 6,
  }));

  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r);
      ctx.restore();
      p.x  += p.vx;
      p.y  += p.vy;
      p.rot += p.vr;
      p.vy += 0.08;
    });
    frame++;
    if (frame < 120) requestAnimationFrame(draw);
    else canvas.classList.add("hidden");
  }
  draw();
}

/* ============================================================
   TOAST
   ============================================================ */
function showToast(msg, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const icons = { success:"fa-circle-check", error:"fa-circle-xmark", info:"fa-circle-info", warning:"fa-triangle-exclamation" };
  toast.innerHTML = `<i class="fa ${icons[type] || icons.info}" style="color:var(--${type==="info"?"accent":type==="success"?"success":type==="warning"?"warning":"danger"})"></i>${msg}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "toastOut 0.35s forwards";
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}