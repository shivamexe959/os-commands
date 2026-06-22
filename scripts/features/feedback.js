import { FeedbackService, BugService, FeatureService } from '../firebase/firestore.js';
import { awardXP } from './xp.js';

let _uid = null;
export function initFeedback(uid) { _uid = uid; }

window._submitFeedback = async function() {
  const rating = parseInt(document.querySelector('.star-rating .active')?.dataset.val || '0');
  const comment = document.getElementById('feedback-comment')?.value.trim();
  const category = document.getElementById('feedback-category')?.value || 'general';
  if (!rating || !comment) { _toast('Please provide a rating and comment.','error'); return; }
  if (!_uid) { _toast('Please sign in.','error'); return; }
  try {
    await FeedbackService.submit(_uid, { rating, comment, category });
    await awardXP(_uid, 'feedback', true);
    _toast('Thank you for your feedback! +25 XP 🎉','success');
    document.getElementById('feedback-comment').value = '';
  } catch(e) { _toast(e.message,'error'); }
};

window._submitBugReport = async function() {
  const title = document.getElementById('bug-title')?.value.trim();
  const description = document.getElementById('bug-desc')?.value.trim();
  const priority = document.getElementById('bug-priority')?.value || 'medium';
  if (!title || !description) { _toast('Title and description are required.','error'); return; }
  if (!_uid) { _toast('Please sign in.','error'); return; }
  try {
    await BugService.submit(_uid, { title, description, priority, page: window.location.href });
    await awardXP(_uid, 'bugReport', true);
    _toast('Bug report submitted! +30 XP 🐛','success');
    document.getElementById('bug-title').value = '';
    document.getElementById('bug-desc').value = '';
  } catch(e) { _toast(e.message,'error'); }
};

window._submitFeatureRequest = async function() {
  const title = document.getElementById('fr-title')?.value.trim();
  const description = document.getElementById('fr-desc')?.value.trim();
  if (!title || !description) { _toast('Title and description are required.','error'); return; }
  if (!_uid) { _toast('Please sign in.','error'); return; }
  try {
    await FeatureService.submit(_uid, { title, description });
    await awardXP(_uid, 'featureRequest', true);
    _toast('Feature request submitted! +25 XP 💡','success');
    document.getElementById('fr-title').value = '';
    document.getElementById('fr-desc').value = '';
  } catch(e) { _toast(e.message,'error'); }
};

export function renderStarRating(containerId) {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = [1,2,3,4,5].map(i =>
    `<span class="star" data-val="${i}" onclick="window._selectStar(${i})">★</span>`).join('');
}

window._selectStar = function(val) {
  document.querySelectorAll('.star').forEach(s => {
    s.classList.toggle('active', parseInt(s.dataset.val) <= val);
  });
};

function _toast(msg,type){ if(typeof showToast==='function') showToast(msg,type); else alert(msg); }
