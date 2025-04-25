import { renderLogin } from './login.js';
import { renderProfile } from './profile.js';

// Create and append the theme toggle button
function createThemeToggle() {
  const toggleButton = document.createElement('button');
  toggleButton.className = 'theme-toggle';
  toggleButton.id = 'theme-toggle';
  toggleButton.title = 'Toggles light & dark';
  toggleButton.setAttribute('aria-label', 'auto');
  toggleButton.setAttribute('aria-live', 'polite');
  toggleButton.innerHTML = `
    <svg class="sun-and-moon" aria-hidden="true" width="24" height="24" viewBox="0 0 24 24">
      <mask class="moon" id="moon-mask">
        <rect x="0" y="0" width="100%" height="100%" fill="white" />
        <circle cx="24" cy="10" r="6" fill="black" />
      </mask>
      <circle class="sun" cx="12" cy="12" r="6" mask="url(#moon-mask)" fill="currentColor" />
      <g class="sun-beams" stroke="currentColor">
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </g>
    </svg>
  `;

  // Position the button appropriately
  toggleButton.style.position = 'fixed';
  toggleButton.style.top = '10px';
  toggleButton.style.right = '10px';
  toggleButton.style.zIndex = '1000';
  toggleButton.style.background = 'none';
  toggleButton.style.border = 'none';
  toggleButton.style.cursor = 'pointer';
  toggleButton.style.padding = '0';

  document.body.appendChild(toggleButton);
  
  // Add external CSS reference for easings
  const linkElement = document.createElement('link');
  linkElement.rel = 'stylesheet';
  linkElement.href = 'https://unpkg.com/open-props/easings.min.css';
  document.head.appendChild(linkElement);
}

// Theme toggle functionality
function setupThemeToggle() {
  const storageKey = 'theme-preference';

  const theme = {
    value: getColorPreference(),
  };

  function getColorPreference() {
    if (localStorage.getItem(storageKey)) {
      return localStorage.getItem(storageKey);
    } else {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
  }

  function setPreference() {
    localStorage.setItem(storageKey, theme.value);
    reflectPreference();
  }

  function reflectPreference() {
    document.firstElementChild
      .setAttribute('data-theme', theme.value);
      
    // Also add dark-mode class to body for compatibility with existing CSS
    if (theme.value === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    document
      .querySelector('#theme-toggle')
      ?.setAttribute('aria-label', theme.value);
  }

  function onClick() {
    // flip current value
    theme.value = theme.value === 'light'
      ? 'dark'
      : 'light';

    setPreference();
  }

  // set early so no page flashes / CSS is made aware
  reflectPreference();

  // Add listener when toggle is available
  setTimeout(() => {
    const themeToggle = document.querySelector('#theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', onClick);
      reflectPreference(); // ensure screen readers can see latest value
    }
  }, 0);

  // sync with system changes
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', ({matches: isDark}) => {
      theme.value = isDark ? 'dark' : 'light';
      setPreference();
    });
}

function main() {
  // Add theme toggle elements and functionality
  createThemeToggle();
  setupThemeToggle();
  
  // Original main function code
  const appContainer = document.getElementById('app');
  const token = localStorage.getItem('jwt'); 

  if (!token) {
    renderLogin(appContainer);
  } else {
    renderProfile(appContainer);
  }
}

// Mouse trail effect
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

// Initialize everything
main();