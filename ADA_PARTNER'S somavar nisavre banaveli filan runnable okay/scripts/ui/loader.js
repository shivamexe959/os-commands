export function showLoader(message = 'Loading...') {
  let loader = document.getElementById('global-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.innerHTML = `<div class="loader-spinner"></div><div class="loader-msg"></div>`;
    document.body.appendChild(loader);
  }
  loader.querySelector('.loader-msg').textContent = message;
  loader.classList.add('active');
}

export function hideLoader() {
  const loader = document.getElementById('global-loader');
  if (loader) loader.classList.remove('active');
}

window.showLoader = showLoader;
window.hideLoader = hideLoader;
