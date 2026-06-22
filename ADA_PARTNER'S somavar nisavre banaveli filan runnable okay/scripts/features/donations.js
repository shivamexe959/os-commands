import { DONATION_CONFIG } from '../../config/donationConfig.js';
import { DonationService } from '../firebase/firestore.js';
import { UserService } from '../firebase/database.js';
import { awardXP } from './xp.js';

let _uid = null;
let _userName = '';

export function initDonations(uid, userName) {
  _uid = uid;
  _userName = userName;
  _renderDonationPanel();
  _loadStats();
}

async function _loadStats() {
  try {
    const stats = await DonationService.getStats();
    const topDonors = await DonationService.getTopDonors(5);
    _updateStatsUI(stats, topDonors);
  } catch (e) { console.warn('Donation stats unavailable', e); }
}

function _renderDonationPanel() {
  const panel = document.getElementById('donation-panel');
  if (!panel) return;
  const cfg = DONATION_CONFIG;
  panel.innerHTML = `
  <div class="donation-header">
    <h2>❤️ Support ADA Lab</h2>
    <p>Keep this platform free for all students</p>
  </div>
  <div class="donation-goal-section">
    <div class="goal-label">Monthly Goal</div>
    <div class="goal-bar-track"><div class="goal-bar-fill" id="don-goal-bar" style="width:0%"></div></div>
    <div class="goal-numbers"><span id="don-raised">₹0</span> / ${cfg.currency}${cfg.monthlyGoal.toLocaleString()}</div>
  </div>
  <div class="donation-amounts">
    ${cfg.amounts.map(a => `<button class="don-amount-btn" onclick="window._donationSelectAmount(${a})">${cfg.currency}${a}</button>`).join('')}
    <input type="number" id="don-custom-amount" placeholder="Custom amount" min="1" />
  </div>
  <div class="donation-upi-section">
    <div class="upi-qr-wrap">
      <img src="${cfg.qrImageUrl}" alt="UPI QR Code" class="upi-qr" onerror="this.style.display='none'" />
    </div>
    <div class="upi-details">
      <div class="upi-id">${cfg.upiId}</div>
      <button class="btn-copy-upi" onclick="window._copyUPI()">📋 Copy UPI ID</button>
      <a class="btn-open-upi" href="upi://pay?pa=${cfg.upiId}&pn=${encodeURIComponent(cfg.upiName)}&am=" id="upi-pay-link">📱 Open UPI App</a>
    </div>
  </div>
  <div class="donation-actions">
    <a class="btn-coffee" href="${cfg.buyMeCoffeeUrl}" target="_blank">☕ Buy Me a Coffee</a>
    <button class="btn-donate-confirm" onclick="window._confirmDonation()">✅ I've Donated</button>
  </div>
  <div class="donation-supporters">
    <h4>🌟 Recent Supporters</h4>
    <div id="don-supporters-list"><em>Loading...</em></div>
  </div>
  <div class="don-stat-row">
    <div class="don-stat"><span id="don-count">0</span><small>Supporters</small></div>
    <div class="don-stat"><span id="don-total">₹0</span><small>Total Raised</small></div>
  </div>`;
}

function _updateStatsUI(stats, topDonors) {
  const cfg = DONATION_CONFIG;
  const raised = stats.totalAmount || 0;
  const pct = Math.min(100, Math.round((raised / cfg.monthlyGoal) * 100));
  const bar = document.getElementById('don-goal-bar');
  const raisedEl = document.getElementById('don-raised');
  const countEl = document.getElementById('don-count');
  const totalEl = document.getElementById('don-total');
  const list = document.getElementById('don-supporters-list');
  if (bar) bar.style.width = pct + '%';
  if (raisedEl) raisedEl.textContent = `₹${raised.toLocaleString()}`;
  if (countEl) countEl.textContent = stats.totalCount || 0;
  if (totalEl) totalEl.textContent = `₹${raised.toLocaleString()}`;
  if (list) {
    list.innerHTML = topDonors.length
      ? topDonors.map(d => `<div class="supporter-chip">💎 ${d.name || 'Anonymous'} — ₹${d.amount}</div>`).join('')
      : '<em>Be the first supporter!</em>';
  }
}

window._donationSelectAmount = function(amount) {
  document.getElementById('don-custom-amount').value = amount;
  const link = document.getElementById('upi-pay-link');
  if (link) link.href = `upi://pay?pa=${DONATION_CONFIG.upiId}&pn=${encodeURIComponent(DONATION_CONFIG.upiName)}&am=${amount}`;
  document.querySelectorAll('.don-amount-btn').forEach(b => b.classList.remove('selected'));
  event?.target?.classList.add('selected');
};

window._copyUPI = function() {
  navigator.clipboard.writeText(DONATION_CONFIG.upiId)
    .then(() => _toast('UPI ID copied!', 'success'))
    .catch(() => _toast('Copy failed — please copy manually.', 'error'));
};

window._confirmDonation = async function() {
  if (!_uid) { _toast('Please sign in first.', 'error'); return; }
  const amount = parseInt(document.getElementById('don-custom-amount')?.value || '0');
  if (!amount || amount < 1) { _toast('Please enter a donation amount first.', 'error'); return; }
  try {
    await DonationService.record(_uid, amount, _userName);
    await awardXP(_uid, 'donation', true);
    _showThankYouDialog();
    _loadStats();
  } catch (e) { _toast('Could not record donation: ' + e.message, 'error'); }
};

function _showThankYouDialog() {
  const d = document.createElement('div');
  d.className = 'modal-overlay active';
  d.innerHTML = `<div class="modal-box donation-thank-you">
    <div class="thank-icon">💖</div>
    <h2>Thank You!</h2>
    <p>${DONATION_CONFIG.thankYouMessage}</p>
    <p>You earned <strong>+${500} XP</strong> and the <strong>💎 Supporter</strong> badge!</p>
    <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">Close</button>
  </div>`;
  document.body.appendChild(d);
}

function _toast(msg, type) {
  if (typeof showToast === 'function') showToast(msg, type);
  else alert(msg);
}
