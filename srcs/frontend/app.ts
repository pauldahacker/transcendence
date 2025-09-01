import { startPong } from './pong.js';

// SPA navigation logic
// Helper to show a page and update browser history
function navigateTo(pageId: string) {
	// Hide all pages
	document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

	// Show only the requested page
	const page = document.getElementById(pageId);
	if (page) page.classList.add('active');

	// Update browser history
	history.pushState({ page: pageId }, '', `#${pageId}`);
}
  
// Handle Back/Forward buttons
window.addEventListener('popstate', (event) => {
	const pageId = event.state?.page || 'home';
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    const page = document.getElementById(pageId);
    if (page) page.classList.add('active');
});
  
  
// Add event listeners for buttons
document.addEventListener('DOMContentLoaded', () => {
	const hash = location.hash.replace('#', '');
	if (hash && document.getElementById(hash)) {
		navigateTo(hash);
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
