import { renderLogin } from './login.js';
import { renderProfile } from './profile.js';

function main() {
    const appContainer = document.getElementById('app');
    const token = localStorage.getItem('jwt'); 

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