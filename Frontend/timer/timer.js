const API_TODAY = "http://localhost:8001/api/timer/today";
const API_LOGS = "http://localhost:8001/api/timer/logs";

const initialTimes = {
  code: 14400,
  valo: 3600,
  workout: 3600,
};

const timers = {
  code: {
    totalElapsed: 0,
    startTime: null,
    interval: null,
    isRunning: false,
  },
  valo: {
    totalElapsed: 0,
    startTime: null,
    interval: null,
    isRunning: false,
  },
  workout: {
    totalElapsed: 0,
    startTime: null,
    interval: null,
    isRunning: false,
  },
};

let returnCount = 0;

function formatTime(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function getElapsedSeconds(id) {
  const timer = timers[id];

  if (!timer.isRunning) {
    return Math.floor(timer.totalElapsed / 1000);
  }

  return Math.floor(
    (timer.totalElapsed + (Date.now() - timer.startTime)) / 1000,
  );
}

function getUsedSeconds(id) {
  return getElapsedSeconds(id);
}

function getRemainingSeconds(id) {
  return Math.max(initialTimes[id] - getElapsedSeconds(id), 0);
}

function renderTimer(id) {
  document.getElementById("time-" + id).textContent = formatTime(
    getRemainingSeconds(id),
  );
}

function startTimer(id) {
  const timer = timers[id];

  if (timer.isRunning) return;

  timer.startTime = Date.now();
  timer.isRunning = true;

  timer.interval = setInterval(() => {
    renderTimer(id);

    if (getRemainingSeconds(id) <= 0) {
      pauseTimer(id);
    }
  }, 250);
}

function pauseTimer(id) {
  const timer = timers[id];

  if (!timer.isRunning) return;

  timer.totalElapsed += Date.now() - timer.startTime;
  timer.startTime = null;
  timer.isRunning = false;

  clearInterval(timer.interval);
  timer.interval = null;

  renderTimer(id);
}

function resetTimer(id) {
  const timer = timers[id];

  clearInterval(timer.interval);

  timer.totalElapsed = 0;
  timer.startTime = null;
  timer.interval = null;
  timer.isRunning = false;

  renderTimer(id);
}

function setTimerMinutes(id) {
  pauseTimer(id);

  const minutes = Number(document.getElementById(`${id}Minutes`).value);

  if (!minutes || minutes <= 0) {
    alert("ใส่นาทีให้ถูกก่อน");
    return;
  }

  initialTimes[id] = minutes * 60;
  resetTimer(id);
}

function addReturn() {
  returnCount++;
  document.getElementById("returnCount").textContent = returnCount;
}

function resetReturn() {
  returnCount = 0;
  document.getElementById("returnCount").textContent = returnCount;
}

async function deleteTimerLog(id) {
  const confirmed = confirm("Delete this log?");

  if (!confirmed) return;

  await fetch(`${API_LOGS}/${id}`, {
    method: "DELETE",
  });

  loadTimerLogs();
}

async function saveTimerLog() {
  pauseTimer("code");
  pauseTimer("valo");
  pauseTimer("workout");

  const data = {
    return_count: returnCount,
    code_seconds: getUsedSeconds("code"),
    valo_seconds: getUsedSeconds("valo"),
    workout_seconds: getUsedSeconds("workout"),
    code_success: document.getElementById("codeSuccess").checked,
    valo_success: document.getElementById("valoSuccess").checked,
    workout_success: document.getElementById("workoutSuccess").checked,
    progressive_overload: document.getElementById("progressiveOverload")
      .checked,
  };

  const res = await fetch(API_TODAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await res.json();
  console.log(result);

  await loadTimerLogs();

  alert("Saved");
}

async function loadTodayTimerLog() {
  const res = await fetch(API_TODAY);
  const result = await res.json();

  if (!result.timer) {
    renderTimer("code");
    renderTimer("valo");
    renderTimer("workout");
    return;
  }

  const timer = result.timer;

  returnCount = timer.return_count;
  document.getElementById("returnCount").textContent = returnCount;

  timers.code.totalElapsed = timer.code_seconds * 1000;
  timers.valo.totalElapsed = timer.valo_seconds * 1000;
  timers.workout.totalElapsed = timer.workout_seconds * 1000;

  renderTimer("code");
  renderTimer("valo");
  renderTimer("workout");

  document.getElementById("codeSuccess").checked = Boolean(timer.code_success);
  document.getElementById("valoSuccess").checked = Boolean(timer.valo_success);
  document.getElementById("workoutSuccess").checked = Boolean(
    timer.workout_success,
  );
  document.getElementById("progressiveOverload").checked = Boolean(
    timer.progressive_overload,
  );
}

async function loadTimerLogs() {
  const res = await fetch(API_LOGS);
  const logs = await res.json();

  const box = document.getElementById("timerLogs");
  box.innerHTML = "";

  logs.forEach((log) => {
    const div = document.createElement("div");
    div.className = "log";

    div.innerHTML = `
      <strong>${new Date(log.log_date).toLocaleDateString("th-TH")}</strong>

      <p>Returns: ${log.return_count}</p>

      <p>Code: ${formatTime(log.code_seconds)}</p>

      <p>Valorant: ${formatTime(log.valo_seconds)}</p>

      <p>Workout: ${formatTime(log.workout_seconds)}</p>

      <p>
        Code Success: ${log.code_success ? "✅" : "❌"} |
        Valo Success: ${log.valo_success ? "✅" : "❌"} |
        Workout Success: ${log.workout_success ? "✅" : "❌"} |
        Overload: ${log.progressive_overload ? "✅" : "❌"}
      </p>

      <button onclick="deleteTimerLog(${log.id})">
        Delete
      </button>

      <hr>
    `;

    box.appendChild(div);
  });
}

loadTodayTimerLog();
loadTimerLogs();