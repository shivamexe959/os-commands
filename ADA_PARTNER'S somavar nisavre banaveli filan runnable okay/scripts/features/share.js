import { awardXP } from './xp.js';

export async function shareAlgorithm(uid, algoName, url) {
  const shareData = {
    title: `${algoName} — ADA Algorithm Lab`,
    text: `Learn ${algoName} with interactive visualizations on ADA Algorithm Lab!`,
    url: url || window.location.href
  };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      if (uid) await awardXP(uid, 'shareAlgo', true);
    } else {
      await navigator.clipboard.writeText(shareData.url);
      if (typeof showToast === 'function') showToast('Link copied to clipboard!', 'success');
      if (uid) await awardXP(uid, 'shareAlgo', true);
    }
  } catch(e) { console.warn('Share failed:', e); }
}
