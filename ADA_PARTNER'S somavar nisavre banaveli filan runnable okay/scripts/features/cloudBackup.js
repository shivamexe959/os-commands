import { UserService } from '../firebase/database.js';
import { NotesService } from '../firebase/firestore.js';
import { storage } from '../storage.js';

export async function backupToCloud(uid) {
  const local = {
    preferences: storage.get('preferences'),
    theme: storage.get('ada_theme'),
    lastAlgo: storage.get('last_algo'),
    backedUpAt: new Date().toISOString()
  };
  await UserService.updateProfile(uid, { cloudBackup: JSON.stringify(local) });
  if (typeof showToast === 'function') showToast('Cloud backup complete! ☁️','success');
}

export async function restoreFromCloud(uid) {
  const user = await UserService.getUser(uid);
  if (!user) return;
  if (user.theme) { storage.set('ada_theme', user.theme); document.body.classList.toggle('theme-light', user.theme === 'light'); }
  if (user.animationSpeed) storage.set('animation_speed', user.animationSpeed);
  if (typeof showToast === 'function') showToast('Settings restored from cloud! ☁️','success');
}
