export function renderProfile(container) {
    // Clear the container
    container.innerHTML = '';
//lgoout button!
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

    document.body.appendChild(logoutButton);

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('jwt'); // Remove JWT
        window.location.reload(); // Reload page to show login
    });
}

    // Create profile content
    const profileContent = document.createElement('div');
    profileContent.className = 'profile-container';
    profileContent.innerHTML = `
        <h1>Welcome, <span id="username"></span></h1>
        <h3 id="fullname"></h3>

        <!-- XP and Additional Boxes -->
        <div class="stats-container">
            <div class="stat-box" id="xp-box">
                <h2>XP</h2>
                <p id="xp-count">Loading...</p>
                <small id="xp-start-info"></small>
            </div>
            <div class="stat-box" id="box2">
                <h2>Graph</h2>
                <div id="xp-graph"></div> <!-- Graph container -->
            </div>
             <div class="stat-box" id="box5">
                <h2>Skills</h2>
                <div id="skills-chart"></div> <!-- Bar chart container -->
            </div>
            <div class="stat-box" id="box4">
                <h2>Audit Ratio</h2>
                <p id="audit-ratio">Fetching...</p>
            </div>
        </div>
    `;

    // Append profile content to the container
    container.appendChild(profileContent);

    // Fetch and display user data
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
        console.warn(data)
        // Display user details
        const user = data.data.user[0]; // Assuming there's only one user
        if (user) {
            document.getElementById('username').textContent = user.firstName;
            document.getElementById('fullname').textContent = `${user.firstName} ${user.lastName}`;
            document.getElementById('audit-ratio').textContent = user.auditRatio ? user.auditRatio.toFixed(2) : "N/A";
        }

        // Render XP and Level
        renderXp(data);
        renderXPGraph(data.data.transaction); // Pass XP transactions to graph
        renderSkillsChart(user.transactions); // Pass skill transactions to bar chart

    } catch (error) {
        console.error(error);
        alert('Error fetching data');
    }
}

function renderXp(data) {
    const transactions = data.data.transaction;
    if (!transactions.length) return;

    const sorted = transactions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const startXP = Math.ceil(sorted[0].amount / 1000); // First recorded XP
    const totalXP = Math.ceil(transactions.reduce((acc, t) => acc + t.amount, 0) / 1000); // Total

    document.getElementById('xp-count').textContent = `${totalXP} KB`;
    document.getElementById('xp-start-info').textContent = `Started at: ${startXP} KB • Now: ${totalXP} KB`;
}


function renderXPGraph(transactions) {
    if (!transactions.length) return;

    let cumulativeXP = 0;
    const sortedData = transactions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const dataPoints = sortedData.map(transaction => {
        cumulativeXP += transaction.amount;
        return { date: new Date(transaction.createdAt), xp: cumulativeXP };
    });

    const width = 400, height = 200;
    const startDate = dataPoints[0].date, endDate = dataPoints[dataPoints.length - 1].date;
    const maxXP = dataPoints[dataPoints.length - 1].xp;

    const scaleX = date => ((date - startDate) / (endDate - startDate)) * width;
    const scaleY = xp => height - (xp / maxXP) * height;

    const pathData = dataPoints.map((point, index) => 
        `${index === 0 ? 'M' : 'L'} ${scaleX(point.date)} ${scaleY(point.xp)}`
    ).join(' ');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', 'green');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-width', '2');
    svg.appendChild(path);

    document.getElementById('xp-graph').innerHTML = '';
    document.getElementById('xp-graph').appendChild(svg);
}
function renderSkillsChart(transactions) {
    if (!transactions.length) return;

    const topSkills = transactions.sort((a, b) => b.amount - a.amount).slice(1, 5);
    
    // Find the maximum XP value for scaling
    const maxSkillXP = Math.max(...transactions.map(t => t.amount));

    const width = 250, height = 170, barWidth = 40;
    const scaleY = xp => height - (xp / maxSkillXP) * height;

    // Create SVG container
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${width} ${height + 20}`);

    topSkills.forEach((transaction, index) => {
        const barHeight = height - scaleY(transaction.amount);
        
        // Create bar
        const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bar.setAttribute('x', index * (barWidth + 15));
        bar.setAttribute('y', scaleY(transaction.amount));
        bar.setAttribute('width', barWidth);
        bar.setAttribute('height', barHeight);
        bar.setAttribute('fill', 'darkgreen');
        bar.style.cursor = 'pointer';

        // Tooltip on hover
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
            tooltip.innerHTML = `${transaction.type.replace('skill_', '')} (${transaction.amount} %)`;
            document.body.appendChild(tooltip);

            bar.addEventListener('mouseout', () => tooltip.remove());
        });

        svg.appendChild(bar);
    });

    document.getElementById('skills-chart').innerHTML = '';
    document.getElementById('skills-chart').appendChild(svg);
}


