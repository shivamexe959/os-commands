import { AnalyticsService } from '../firebase/analytics.js';

export async function initAnalyticsDashboard() {
  try {
    const [algoStats, searchStats] = await Promise.all([
      AnalyticsService.getAlgorithmStats(),
      AnalyticsService.getSearchStats()
    ]);
    renderTopAlgos(algoStats);
    renderTopSearches(searchStats);
  } catch(e) { console.warn('Analytics dashboard:', e); }
}

function renderTopAlgos(stats) {
  const container = document.getElementById('top-algos-chart');
  if (!container) return;
  const entries = Object.entries(stats).sort(([,a],[,b]) => b - a).slice(0, 10);
  if (!entries.length) { container.innerHTML = '<p class="empty">No data yet.</p>'; return; }
  const max = entries[0][1] || 1;
  container.innerHTML = entries.map(([name, count]) => `
    <div class="breakdown-row">
      <span style="width:140px;text-align:right;flex-shrink:0">${_esc(name)}</span>
      <div class="breakdown-bar-track" style="flex:1"><div class="breakdown-bar-fill" style="width:${Math.round(count/max*100)}%"></div></div>
      <span>${count}</span>
    </div>`).join('');
}

function renderTopSearches(stats) {
  const container = document.getElementById('top-searches-chart');
  if (!container) return;
  const entries = Object.entries(stats).sort(([,a],[,b]) => b - a).slice(0, 10);
  if (!entries.length) { container.innerHTML = '<p class="empty">No searches yet.</p>'; return; }
  const max = entries[0][1] || 1;
  container.innerHTML = entries.map(([q, count]) => `
    <div class="breakdown-row">
      <span style="width:140px;text-align:right;flex-shrink:0">${_esc(q)}</span>
      <div class="breakdown-bar-track" style="flex:1"><div class="breakdown-bar-fill" style="width:${Math.round(count/max*100)}%"></div></div>
      <span>${count}</span>
    </div>`).join('');
}

function _esc(s) { return String(s||'').replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }
