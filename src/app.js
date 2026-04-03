// Renderer logic for XBat widget

const canvas = document.getElementById('battery-gauge');
const ctx = canvas.getContext('2d');
const gaugePercent = document.getElementById('gauge-percent');
const gaugeLabel = document.getElementById('gauge-label');
const chipDot = document.getElementById('chip-dot');
const batteryTypeText = document.getElementById('battery-type-text');
const sessionTimer = document.getElementById('session-timer');
const noController = document.getElementById('no-controller');
const controllerView = document.getElementById('controller-view');
const statTodayTime = document.getElementById('stat-today-time');
const statTodaySessions = document.getElementById('stat-today-sessions');
const statAvgSession = document.getElementById('stat-avg-session');
const totalPlaytime = document.getElementById('total-playtime');
const totalSessions = document.getElementById('total-sessions');
const batteryLabelInput = document.getElementById('battery-label');
const historyChart = document.getElementById('history-chart');
const hCtx = historyChart.getContext('2d');

const historyPanel = document.getElementById('history-panel');
const sessionList = document.getElementById('session-list');

let currentControllerIndex = 0;
let lastData = null;
let timerInterval = null;
let showingHistory = false;

function formatMs(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatHours(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function drawGauge(percent, color) {
  const cx = 90, cy = 90, r = 75;
  ctx.clearRect(0, 0, 180, 180);
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 14; ctx.stroke();
  const endAngle = (percent / 100) * Math.PI * 2 - Math.PI / 2;
  ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, endAngle); ctx.strokeStyle = color; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.stroke();
  ctx.shadowBlur = 15; ctx.shadowColor = color; ctx.stroke(); ctx.shadowBlur = 0;
}

function drawSparkline(sessions) {
  if (!sessions || sessions.length < 2) {
    hCtx.clearRect(0, 0, 320, 70);
    return;
  }
  hCtx.clearRect(0, 0, 320, 70);
  hCtx.beginPath(); hCtx.strokeStyle = 'rgba(34,197,94,0.3)'; hCtx.lineWidth = 2;
  const step = 320 / (sessions.length - 1);
  sessions.forEach((s, i) => {
    const y = 70 - (s.endBatteryPercent / 100 * 50 + 10);
    if (i === 0) hCtx.moveTo(0, y); else hCtx.lineTo(i * step, y);
  });
  hCtx.stroke();
}

function renderSessionList(history) {
  sessionList.innerHTML = '';
  if (!history || history.length === 0) {
    sessionList.innerHTML = '<div class="no-ctrl-sub" style="text-align:center;padding:20px;">No history recorded yet</div>';
    return;
  }

  // Show newest first
  [...history].reverse().forEach(s => {
    const item = document.createElement('div');
    item.className = 'session-item';
    const date = new Date(s.endTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const duration = formatHours(s.durationMs);
    const drain = s.levelsDropped;
    const drainClass = drain > 15 ? 'drain-high' : 'drain-low';
    
    item.innerHTML = `
      <div class="session-item-row">
        <span class="session-item-label">${s.label}</span>
        <span class="session-item-duration">${duration}</span>
      </div>
      <div class="session-item-row">
        <span class="session-item-date">${date}</span>
        <span class="session-item-drain">
          <span class="drain-pill ${drainClass}">${drain}%</span> drain
          <span class="footer-dot">·</span> ${s.batteryType}
        </span>
      </div>
    `;
    sessionList.appendChild(item);
  });
}

function toggleHistory(show) {
  showingHistory = show;
  if (show) {
    historyPanel.style.display = 'flex';
    controllerView.style.display = 'none';
    if (lastData) renderSessionList(lastData.history);
  } else {
    historyPanel.style.display = 'none';
    controllerView.style.display = 'block';
  }
}

function updateUI(data) {
  lastData = data;
  const ctrl = data.controllers[currentControllerIndex];
  if (!ctrl || !ctrl.connected) {
    noController.style.display = 'flex'; controllerView.style.display = 'none';
    return;
  }
  noController.style.display = 'none'; controllerView.style.display = 'block';
  gaugePercent.textContent = ctrl.batteryLabel === 'Unknown' ? '??%' : `${ctrl.batteryPercent}%`;
  gaugeLabel.textContent = ctrl.batteryLabel;
  chipDot.style.backgroundColor = ctrl.batteryColor;
  batteryTypeText.textContent = ctrl.batteryType;
  drawGauge(ctrl.batteryPercent, ctrl.batteryColor);
  const session = data.sessions[currentControllerIndex];
  if (session) {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => { sessionTimer.textContent = formatMs(Date.now() - session.startTime); }, 1000);
  } else {
    clearInterval(timerInterval); sessionTimer.textContent = '00:00:00';
  }
  statTodayTime.textContent = formatHours(data.stats.todayPlayTimeMs);
  statTodaySessions.textContent = data.stats.todaySessions;
  statAvgSession.textContent = formatHours(data.stats.avgSessionMs);
  totalPlaytime.textContent = `${Math.floor(data.stats.totalPlayTimeMs / 3600000)}h`;
  totalSessions.textContent = data.stats.totalSessions;
  batteryLabelInput.value = data.labels[currentControllerIndex] || '';
  drawSparkline(data.history);
}

window.xbat.onControllerUpdate(updateUI);
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelector('.tab.active').classList.remove('active');
    tab.classList.add('active'); currentControllerIndex = parseInt(tab.dataset.index);
    if (lastData) updateUI(lastData);
  });
});
batteryLabelInput.addEventListener('change', () => window.xbat.setLabel(currentControllerIndex, batteryLabelInput.value));
document.getElementById('btn-minimize').onclick = () => window.xbat.minimize();
document.getElementById('btn-close').onclick = () => window.xbat.close();
document.getElementById('btn-history').onclick = () => toggleHistory(true);
document.getElementById('btn-history-close').onclick = () => toggleHistory(false);

window.xbat.getData().then(updateUI);
setInterval(async () => { const data = await window.xbat.getData(); if (data) updateUI(data); }, 5000);
