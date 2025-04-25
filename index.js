import { renderLogin } from './login.js';
import { renderProfile } from './profile.js';

const toggleButton = document.createElement('button');
toggleButton.id = 'darkModeToggle';
toggleButton.textContent = '🌙';
toggleButton.style.position = 'fixed';
toggleButton.style.top = '10px';
toggleButton.style.right = '10px';
toggleButton.style.zIndex = '1000';
toggleButton.style.padding = '8px 12px';
toggleButton.style.borderRadius = '8px';
toggleButton.style.border = 'none';
toggleButton.style.cursor = 'pointer';
document.body.appendChild(toggleButton);

function setupDarkModeToggle() {
  const button = document.getElementById('darkModeToggle');
  const prefersDark = localStorage.getItem('theme') === 'dark';

  if (prefersDark) {
      document.body.classList.add('dark-mode');
      button.textContent = '☀️';
  }

  button.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      button.textContent = isDark ? '☀️' : '🌙 ';
  });
}

function main() {
    const appContainer = document.getElementById('app');
    const token = localStorage.getItem('jwt'); 
    setupDarkModeToggle()
    if (!token) {
        renderLogin(appContainer);
    } else {
        renderProfile(appContainer);
    }
}
document.addEventListener('mousemove', (e) => {
    const dot = document.createElement('div');
    dot.classList.add('trail-dot');
    dot.style.left = `${e.clientX}px`;
    dot.style.top = `${e.clientY}px`;
  
    document.body.appendChild(dot);
  
    setTimeout(() => {
      dot.remove(); 
    }, 600);
  });
  

main();