import { UserService } from '../firebase/database.js';

let _uid = null;
export function initPreferences(uid, userData) {
  _uid = uid;
  _applyPreferences(userData);
  _renderPreferencesForm(userData);
}

function _applyPreferences(userData) {
  if (!userData) return;
  if (userData.theme === 'light') document.body.classList.add('theme-light');
  const speed = userData.animationSpeed || 'medium';
  document.documentElement.style.setProperty('--anim-speed', speed==='slow'?'0.5x':speed==='fast'?'2x':'1x');
  const size = userData.fontSize || 'medium';
  document.documentElement.style.setProperty('--font-size-base', size==='small'?'13px':size==='large'?'17px':'15px');
}

function _renderPreferencesForm(userData) {
  const form = document.getElementById('preferences-form');
  if (!form) return;
  form.innerHTML = `
  <div class="pref-group">
    <label>Theme</label>
    <select id="pref-theme" onchange="window._applyThemePref(this.value)">
      <option value="dark" ${userData?.theme==='dark'?'selected':''}>Dark (Default)</option>
      <option value="light" ${userData?.theme==='light'?'selected':''}>Light</option>
    </select>
  </div>
  <div class="pref-group">
    <label>Animation Speed</label>
    <select id="pref-speed">
      <option value="slow" ${userData?.animationSpeed==='slow'?'selected':''}>Slow</option>
      <option value="medium" ${userData?.animationSpeed==='medium'?'selected':''}>Medium</option>
      <option value="fast" ${userData?.animationSpeed==='fast'?'selected':''}>Fast</option>
    </select>
  </div>
  <div class="pref-group">
    <label>Font Size</label>
    <select id="pref-fontsize">
      <option value="small" ${userData?.fontSize==='small'?'selected':''}>Small</option>
      <option value="medium" ${userData?.fontSize==='medium'?'selected':''}>Medium</option>
      <option value="large" ${userData?.fontSize==='large'?'selected':''}>Large</option>
    </select>
  </div>
  <div class="pref-group pref-toggle">
    <label>Notifications</label>
    <input type="checkbox" id="pref-notif" ${userData?.notificationsEnabled?'checked':''} />
  </div>
  <div class="pref-group pref-toggle">
    <label>Auto Save Notes</label>
    <input type="checkbox" id="pref-autosave" checked />
  </div>
  <button class="btn-primary" onclick="window._savePreferences()">Save Preferences</button>`;
}

window._applyThemePref = function(theme) {
  document.body.classList.toggle('theme-light', theme === 'light');
};

window._savePreferences = async function() {
  if (!_uid) return;
  const data = {
    theme: document.getElementById('pref-theme')?.value || 'dark',
    animationSpeed: document.getElementById('pref-speed')?.value || 'medium',
    fontSize: document.getElementById('pref-fontsize')?.value || 'medium',
    notificationsEnabled: document.getElementById('pref-notif')?.checked ?? true
  };
  await UserService.updateProfile(_uid, data);
  _applyPreferences(data);
  if (typeof showToast === 'function') showToast('Preferences saved!','success');
};
