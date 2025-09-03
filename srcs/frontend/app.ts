import { startPong } from './pong.js';

// SPA navigation logic
function navigateTo(pageId: string) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => {
    p.classList.add('hidden');
    p.classList.remove('flex');
  });

  // Show only the requested page
  const page = document.getElementById(pageId);
  if (page) {
    page.classList.remove('hidden');
    page.classList.add('flex');
  }

  // Update browser history
  history.pushState({ page: pageId }, '', `#${pageId}`);

  requestAnimationFrame(() =>
    window.scrollTo({ top: 0, behavior: 'instant' })
  );
}

// Handle Back/Forward buttons
window.addEventListener('popstate', (event) => {
  const pageId = event.state?.page || 'home';

  document.querySelectorAll('.page').forEach(p => {
    p.classList.add('hidden');
    p.classList.remove('flex');
  });

  const page = document.getElementById(pageId);
  if (page) {
    page.classList.remove('hidden');
    page.classList.add('flex');
  }
});

// Add event listeners for buttons
document.addEventListener('DOMContentLoaded', () => {
  const hash = location.hash.replace('#', '');
  if (hash && document.getElementById(hash)) {
    navigateTo(hash);
    if (hash === 'game') {
      startPong();
    }
  } else {
    navigateTo('home');
  }

  document.getElementById('start-game')?.addEventListener('click', () => {
    navigateTo('game');
    startPong();
  });

  document.getElementById('back-home')?.addEventListener('click', () => {
    navigateTo('home');
  });
});
