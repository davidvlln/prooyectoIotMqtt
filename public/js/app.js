const API = '';
const socket = io();

let selectedNode = '';
let readings = [];
let sparkChart = null;

document.addEventListener('DOMContentLoaded', () => {
  startClock();
  loadNodes();
  setupSocket();
  setupSelect();
});

/* ─── Clock ─── */

function startClock() {
  const el = document.getElementById('clock');
  function tick() {
    const now = new Date();
    el.textContent = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  }
  tick();
  setInterval(tick, 1000);
}

/* ─── API helper ─── */

async function fetchAPI(path) {
  const res = await fetch(`${API}/api${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.status !== 'success') throw new Error(json.message || 'Error');
  return json.data;
}

/* ─── Nodes ─── */

async function loadNodes() {
  try {
    const nodos = await fetchAPI('/nodos');
    const select = document.getElementById('nodeSelect');
    select.innerHTML = '<option value="" disabled selected>Seleccionar nodo</option>';
    nodos.forEach(id => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = id;
      select.appendChild(opt);
    });
    document.getElementById('totalNodes').textContent = nodos.length;
  } catch (err) {
    console.warn('Error cargando nodos:', err);
  }
}

/* ─── Socket ─── */

function setupSocket() {
  const dot = document.querySelector('.topbar__dot');
  const label = document.querySelector('.topbar__label');

  socket.on('connect', () => {
    dot.classList.remove('topbar__dot--off');
    label.textContent = 'en vivo';
    if (selectedNode) {
      socket.emit('join-node', selectedNode);
    }
  });

  socket.on('disconnect', () => {
    dot.classList.add('topbar__dot--off');
    label.textContent = 'desconectado';
  });

  socket.on('sensor-reading', (data) => {
    if (data.node_id !== selectedNode) return;
    readings.push(data);
    if (readings.length > 100) readings.shift();
    updatePrimary(data);
    updateChart();
    addLogRow(data);
    document.getElementById('logCount').textContent = readings.length;
  });
}

function setupSelect() {
  document.getElementById('nodeSelect').addEventListener('change', async (e) => {
    if (selectedNode) {
      socket.emit('leave-node', selectedNode);
    }
    selectedNode = e.target.value;
    socket.emit('join-node', selectedNode);
    await loadHistory(selectedNode);
  });
}

/* ─── History (REST) ─── */

async function loadHistory(nodeId) {
  try {
    const data = await fetchAPI(`/sensores?nodo=${encodeURIComponent(nodeId)}&limite=50`);
    readings = data.reverse();
    document.getElementById('logCount').textContent = readings.length;
    if (readings.length > 0) {
      updatePrimary(readings[readings.length - 1]);
      updateChart();
      renderLog(readings);
      showLive();
    } else {
      showEmpty();
    }
  } catch (err) {
    console.warn('Error cargando historial:', err);
    showEmpty();
  }
}

function showLive() {
  document.getElementById('emptyState').classList.add('hidden');
  document.getElementById('liveView').classList.remove('hidden');
  document.getElementById('chartEmpty')?.classList.add('hidden');
}

function showEmpty() {
  document.getElementById('emptyState').classList.remove('hidden');
  document.getElementById('liveView').classList.add('hidden');
}

/* ─── Primary display ─── */

function updatePrimary(data) {
  if (!data) return;

  const temp = typeof data.temperatura === 'number' && !isNaN(data.temperatura)
    ? data.temperatura.toFixed(1) : '--.--';
  const hum = data.humedad_aire != null ? data.humedad_aire : '--';
  const soil = data.humedad_suelo != null ? data.humedad_suelo : '--';
  const time = data.created_at
    ? new Date(data.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '--:--';

  const tempEl = document.getElementById('tempValue');
  tempEl.textContent = temp;

  const numTemp = parseFloat(temp);
  tempEl.className = 'primary__value';
  if (numTemp > 35) tempEl.classList.add('temp-hot');
  else if (numTemp > 28) tempEl.classList.add('temp-warm');
  else if (numTemp < 15) tempEl.classList.add('temp-cold');
  else tempEl.classList.add('temp-moderate');

  document.getElementById('humValue').textContent = hum;
  document.getElementById('soilValue').textContent = soil;
  document.getElementById('lastValue').textContent = time;

  const ring = document.querySelector('.primary__ring');
  ring.classList.add('primary__ring--live');
}

/* ─── Chart ─── */

function updateChart() {
  const temps = readings.map(r => r.temperatura);
  const labels = readings.map(r => {
    const d = new Date(r.created_at);
    return isNaN(d) ? '' : d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
  });

  const ctx = document.getElementById('sparkChart');
  if (!ctx) return;

  const cfg = {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: temps,
        borderColor: '#2B6B4A',
        backgroundColor: 'rgba(43,107,74,0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1A1A1A',
          titleFont: { family: "'JetBrains Mono'", size: 10 },
          bodyFont: { family: "'Inter'", size: 11 },
          padding: 6,
          cornerRadius: 4,
          displayColors: false,
        },
      },
      scales: {
        x: {
          ticks: { font: { size: 8, family: "'JetBrains Mono'" }, color: '#8A8A88', maxTicksLimit: 6 },
          grid: { display: false },
        },
        y: {
          ticks: { font: { size: 8, family: "'JetBrains Mono'" }, color: '#8A8A88', maxTicksLimit: 4 },
          grid: { color: 'rgba(230,228,222,0.4)' },
        },
      },
      interaction: { intersect: false, mode: 'index' },
    },
  };

  if (sparkChart) {
    sparkChart.data = cfg.data;
    sparkChart.update('none');
  } else {
    sparkChart = new Chart(ctx, cfg);
  }
}

/* ─── Log ─── */

function renderLog(data) {
  const tbody = document.getElementById('logBody');
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="log__empty">Sin registros</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(r => {
    const temp = typeof r.temperatura === 'number' && !isNaN(r.temperatura) ? r.temperatura.toFixed(1) : '—';
    const hum = r.humedad_aire != null ? r.humedad_aire : '—';
    const soil = r.humedad_suelo != null ? r.humedad_suelo : '—';
    const time = r.created_at
      ? new Date(r.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      : '—';
    return `<tr><td style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text-muted)">${time}</td><td class="num">${temp}</td><td class="num">${hum}</td><td class="num">${soil}</td></tr>`;
  }).join('');
}

function addLogRow(data) {
  const tbody = document.getElementById('logBody');
  const time = data.created_at
    ? new Date(data.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    : '—';
  const temp = typeof data.temperatura === 'number' && !isNaN(data.temperatura) ? data.temperatura.toFixed(1) : '—';
  const hum = data.humedad_aire != null ? data.humedad_aire : '—';
  const soil = data.humedad_suelo != null ? data.humedad_suelo : '—';

  const row = document.createElement('tr');
  row.innerHTML = `<td style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text-muted)">${time}</td><td class="num">${temp}</td><td class="num">${hum}</td><td class="num">${soil}</td>`;

  if (tbody.children.length === 1 && tbody.children[0].classList.contains('log__empty')) {
    tbody.innerHTML = '';
  }

  row.classList.add('flash');
  tbody.insertBefore(row, tbody.firstChild);

  const maxRows = 50;
  while (tbody.children.length > maxRows) {
    tbody.removeChild(tbody.lastChild);
  }

  setTimeout(() => row.classList.remove('flash'), 600);
}
