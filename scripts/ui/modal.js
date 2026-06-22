export function openModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

export function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('active'); document.body.style.overflow = ''; }
}

export function closeAllModals() {
  document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
  document.body.style.overflow = '';
}

export function initModalCloseHandlers() {
  document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) closeAllModals();
    if (e.target.classList.contains('modal-close')) {
      const m = e.target.closest('.modal-overlay');
      if (m) { m.classList.remove('active'); document.body.style.overflow = ''; }
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAllModals(); });
}

window.openModal = openModal;
window.closeModal = closeModal;
window.closeAllModals = closeAllModals;
