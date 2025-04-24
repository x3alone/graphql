export function renderProfile(container) {
    // Clear the container
    container.innerHTML = '';
    document.body.className = 'profile-page';

    // Create and append logout button if not present
    if (!document.getElementById('logout')) {
        const logoutButton = document.createElement('button');
        logoutButton.id = 'logout';
        logoutButton.className = 'logout-btn';
        logoutButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" 
                 fill="none" viewBox="0 0 24 24" 
                 stroke="currentColor" stroke-width="2" 
                 width="24" height="24">
                <path stroke-linecap="round" stroke-linejoin="round" 
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
            </svg>
        `;

        container.appendChild(logoutButton); // Append it inside the container

        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('jwt'); // Remove JWT
            window.location.reload(); // Reload page to show login
        });
    }

    // Create profile content
    const profileContent = document.createElement('div');
    profileContent.className = 'profile-container';
    profileContent.innerHTML = `
        <h1 class="scroll-animate">Welcome, <span id="username"></span></h1>
        <h3 class="scroll-animate" id="fullname"></h3>

        <div class="stats-container">
            <div class="stat-box scroll-animate" id="xp-box">
                <h2>XP</h2>
                <p id="xp-count">Loading...</p>
                <small id="xp-start-info"></small>
            </div>
            <div class="stat-box scroll-animate" id="box2">
                <h2>Graph</h2>
                <div id="xp-graph"></div>
            </div>
            <div class="stat-box scroll-animate" id="box5">
                <h2>Skills</h2>
                <div id="skills-chart"></div>
            </div>
            <div class="stat-box scroll-animate" id="box4">
                <h2>Audit Ratio</h2>
                <p id="audit-ratio">Fetching...</p>
            </div>
        </div>
    `;

    // Append profile content to the container
    container.appendChild(profileContent);

    // Initialize IntersectionObserver for scroll animations
     const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                entry.target.classList.remove('visible'); // Optional: remove animation if scrolled out of view
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.scroll-animate').forEach(el => observer.observe(el));

    // Fetch user data after rendering profile content
    fetchUserData();
}

async function fetchUserData() {
    const token = localStorage.getItem('jwt');
    if (!token) {
        window.location.reload(); // Redirect to login if no token is found
        return;
    }

    const query = {
        query: `{
            user {
                firstName
                lastName
                auditRatio
                totalUp
                totalDown
                transactions(
                    where: { type: { _like: "skill_%" } }
                    order_by: { amount: desc }
                ) {
                    type
                    amount
                }
            }
            transaction(
                where: { _and: [{ type: { _eq: "xp" } }, { eventId: { _eq: 41 } }] }
            ) {
                amount
                createdAt
                object { name }
            }
        }`
    };
    

    try {
        const response = await fetch('https://learn.zone01oujda.ma/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });

        const data = await response.json();
        if (!data || !data.data) throw new Error('Failed to fetch user data');

        const user = data.data.user[0]; // Assuming there's only one user
        if (user) {
            document.getElementById('username').textContent = user.firstName;
            document.getElementById('fullname').textContent = `${user.firstName} ${user.lastName}`;
            document.getElementById('audit-ratio').textContent = user.auditRatio ? user.auditRatio.toFixed(2) : "N/A";
        
            renderAuditRatioGraph(user.totalUp, user.totalDown);
        }
        

        // Render XP, Graph, and Skills
        renderXp(data);
        renderXPGraph(data.data.transaction); // Pass XP transactions to graph
        renderSkillsChart(user.transactions); // Pass skill transactions to bar chart

    } catch (error) {
        console.error(error);
        alert('Error fetching data');
    }
}

// Your renderXP, renderXPGraph, and renderSkillsChart functions remain unchanged


function renderXp(data) {
    const transactions = data.data.transaction;
    if (!transactions.length) return;

    const sorted = transactions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const startXP = Math.ceil(sorted[0].amount / 1000); // First recorded XP
    const totalXP = Math.ceil(transactions.reduce((acc, t) => acc + t.amount, 0) / 1000); // Total

    document.getElementById('xp-count').textContent = `${totalXP} KB`;
    document.getElementById('xp-start-info').textContent = `Started at: ${startXP} KB • Now: ${totalXP} KB`;
}

function renderAuditRatioGraph(up, down) {
    const max = Math.max(up, down);
    const width = 250;
    const height = 12;

    const scale = value => (value / max) * width;

    const doneWidth = scale(up);
    const receivedWidth = scale(down);

    const container = document.createElement('div');
    container.innerHTML = `
        <div style="margin-bottom: 4px; font-size: 12px;">Done</div>
        <svg width="${width}" height="${height}">
            <line x1="0" y1="${height / 2}" x2="${doneWidth}" y2="${height / 2}"
                  stroke="var(--green)" stroke-width="6" />
        </svg>
        <div style="margin: 4px 0 12px; font-size: 12px;">Received</div>
        <svg width="${width}" height="${height}">
            <line x1="0" y1="${height / 2}" x2="${receivedWidth}" y2="${height / 2}"
                  stroke="var(--palegreen)" stroke-width="6" />
        </svg>
        <div style="margin-top: 6px; font-size: 12px; color: #888;">
            <strong style="color: var(--green);">+${up/1000}KB</strong> / 
            <strong style="color: var(--palegreen);">-${down/1000}KB</strong>
        </div>
    `;

    const graphTarget = document.getElementById('box4');
    graphTarget.appendChild(container);
}


function renderXPGraph(transactions) {
    if (!transactions.length) return;

    let cumulativeXP = 0;
    const sortedData = transactions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const dataPoints = sortedData.map(tx => {
        cumulativeXP += tx.amount;
        return {
            date: new Date(tx.createdAt),
            xp: cumulativeXP,
            project: tx.object?.name || 'Unknown',
            gained: tx.amount
        };
    });

    const width = 400, height = 220, margin = 40;
    const startDate = dataPoints[0].date, endDate = dataPoints[dataPoints.length - 1].date;
    const maxXP = dataPoints[dataPoints.length - 1].xp;

    const scaleX = date => margin + ((date - startDate) / (endDate - startDate)) * (width - margin);
    const scaleY = xp => height - margin - (xp / maxXP) * (height - margin);

    const pathData = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.date)} ${scaleY(p.xp)}`).join(' ');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    // Draw axes
    const axisX = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    axisX.setAttribute('x1', margin);
    axisX.setAttribute('y1', height - margin);
    axisX.setAttribute('x2', width);
    axisX.setAttribute('y2', height - margin);
    axisX.setAttribute('stroke', '#ccc');
    svg.appendChild(axisX);

    const axisY = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    axisY.setAttribute('x1', margin);
    axisY.setAttribute('y1', 0);
    axisY.setAttribute('x2', margin);
    axisY.setAttribute('y2', height - margin);
    axisY.setAttribute('stroke', '#ccc');
    svg.appendChild(axisY);

    // Draw the path line
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', 'green');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-width', '2');
    svg.appendChild(path);

    // Add data point circles and tooltips
    dataPoints.forEach(point => {
        const cx = scaleX(point.date);
        const cy = scaleY(point.xp);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', 4);
        circle.setAttribute('fill', '#0a0');
        circle.style.cursor = 'pointer';

        // Tooltip on hover
        circle.addEventListener('mouseover', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.style.position = 'absolute';
            tooltip.style.left = `${e.pageX + 10}px`;
            tooltip.style.top = `${e.pageY - 10}px`;
            tooltip.style.padding = '6px 10px';
            tooltip.style.borderRadius = '4px';
            tooltip.style.background = '#222';
            tooltip.style.color = '#fff';
            tooltip.style.fontSize = '12px';
            tooltip.style.zIndex = '1000';
            tooltip.innerHTML = `
                <strong>${point.project}</strong><br/>
                +${point.gained} XP<br/>
                ${point.date.toLocaleDateString()}
            `;
            document.body.appendChild(tooltip);

            circle.addEventListener('mouseout', () => tooltip.remove());
        });

        svg.appendChild(circle);
    });

    const graphContainer = document.getElementById('xp-graph');
    graphContainer.innerHTML = '';
    graphContainer.appendChild(svg);
}

function renderSkillsChart(transactions) {
    if (!transactions.length) return;

    // Group by skill type and keep the highest amount for each
    const skillMap = {};
    transactions.forEach(tx => {
        if (!skillMap[tx.type] || skillMap[tx.type].amount < tx.amount) {
            skillMap[tx.type] = tx;
        }
    });

    // Get the top 5 skills by amount
    const topSkills = Object.values(skillMap)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

    const maxSkillXP = Math.max(...topSkills.map(t => t.amount));

    const width = 250, height = 170, barWidth = 38;
    const scaleY = xp => height - (xp / maxSkillXP) * height;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${width} ${height + 20}`);

    topSkills.forEach((tx, index) => {
        const barHeight = height - scaleY(tx.amount);

        const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bar.setAttribute('x', index * (barWidth + 15));
        bar.setAttribute('y', scaleY(tx.amount));
        bar.setAttribute('width', barWidth);
        bar.setAttribute('height', barHeight);
        bar.setAttribute('fill', 'darkgreen');
        bar.style.cursor = 'pointer';

        bar.addEventListener('mouseover', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.style.position = 'absolute';
            tooltip.style.left = `${e.pageX + 10}px`;
            tooltip.style.top = `${e.pageY - 10}px`;
            tooltip.style.padding = '5px';
            tooltip.style.borderRadius = '3px';
            tooltip.style.background = 'black';
            tooltip.style.color = 'white';
            tooltip.style.fontSize = '12px';
            tooltip.innerHTML = `${tx.type.replace('skill_', '')} (${tx.amount} XP)`;
            document.body.appendChild(tooltip);

            bar.addEventListener('mouseout', () => tooltip.remove());
        });

        svg.appendChild(bar);
    });

    document.getElementById('skills-chart').innerHTML = '';
    document.getElementById('skills-chart').appendChild(svg);
}



const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        } else {
            entry.target.classList.remove('visible');
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.scroll-animate').forEach(el => observer.observe(el));

// Ensure that graphs animate when entering the view
document.querySelectorAll('.graph').forEach(el => observer.observe(el));