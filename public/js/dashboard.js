// Dashboard functionality
async function loadDashboardData() {
    try {
        // Load employee count and districts info
        const [employeeRes, employeesListRes] = await Promise.all([
            fetch('/api/employees/count', {
                credentials: 'same-origin',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            }),
            fetch('/api/employees', {
                credentials: 'same-origin',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
        ]);
        
        if (employeeRes.ok && employeesListRes.ok) {
            const countData = await employeeRes.json();
            const employeesList = await employeesListRes.json();
            
            // Update district statistics
            updateDistrictStatistics(employeesList);
        }

        // Load recent broadcasts
        loadRecentBroadcasts();
        
        // Refresh every 30 seconds
        setInterval(loadRecentBroadcasts, 30000);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadRecentBroadcasts() {
    try {
        const response = await fetch('/api/broadcast/recent', {
            credentials: 'same-origin',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        if (response.ok) {
            const broadcasts = await response.json();
            updateBroadcastsTable(broadcasts);
        }
    } catch (error) {
        console.error('Error loading broadcasts:', error);
    }
}

function updateBroadcastsTable(broadcasts) {
    const tbody = document.getElementById('recentBroadcasts');
    
    if (!broadcasts || broadcasts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Ma\'lumot yo\'q</td></tr>';
        return;
    }
    
    tbody.innerHTML = broadcasts.map(broadcast => {
        const time = new Date(broadcast.createdAt).toLocaleString('uz-UZ');
        const statusClass = broadcast.status === 'completed' ? 'success' : 
                          broadcast.status === 'active' ? 'warning' : 'danger';
        const statusText = broadcast.status === 'completed' ? 'Tugallangan' :
                          broadcast.status === 'active' ? 'Faol' : 'Xato';
        
        return `
            <tr>
                <td>${time}</td>
                <td>${broadcast.message || 'Audio xabar'}</td>
                <td>${broadcast.totalRecipients || 0}</td>
                <td>${broadcast.confirmedCount || 0}</td>
                <td><span class="badge badge-${statusClass}">${statusText}</span></td>
            </tr>
        `;
    }).join('');
}

function updateDistrictStatistics(employees) {
    const container = document.getElementById('districtStatistics');
    if (!container) return;
    
    // Count employees by district
    const districtCounts = {};
    let totalCount = 0;
    
    employees.forEach(emp => {
        const district = emp.district || 'Belgilanmagan';
        districtCounts[district] = (districtCounts[district] || 0) + 1;
        totalCount++;
    });
    
    // Sort districts by count
    const sortedDistricts = Object.entries(districtCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8); // Show top 8 districts
    
    // Create cards HTML
    let cardsHTML = '';
    
    // Total employees card
    cardsHTML += `
        <div class="md-card md-card-outlined">
            <div style="padding: var(--md-sys-spacing-6);">
                <div style="display: flex; align-items: center; gap: var(--md-sys-spacing-4); margin-bottom: var(--md-sys-spacing-4);">
                    <div style="width: var(--md-sys-spacing-12); height: var(--md-sys-spacing-12); background: var(--md-sys-color-primary-container); border-radius: var(--md-sys-shape-corner-medium); display: flex; align-items: center; justify-content: center;">
                        <span class="material-symbols-outlined" style="font-size: var(--md-sys-spacing-6); color: var(--md-sys-color-on-primary-container);">
                            groups
                        </span>
                    </div>
                    <div>
                        <div class="md-typescale-headline-large" style="color: var(--md-sys-color-on-surface);">
                            ${totalCount}
                        </div>
                    </div>
                </div>
                <h3 class="md-typescale-body-large" style="color: var(--md-sys-color-on-surface-variant); margin: 0;">
                    Jami xodimlar
                </h3>
            </div>
        </div>
    `;
    
    // District cards
    sortedDistricts.forEach(([district, count]) => {
        const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
        cardsHTML += `
            <div class="md-card md-card-outlined">
                <div style="padding: var(--md-sys-spacing-6);">
                    <div style="display: flex; align-items: center; gap: var(--md-sys-spacing-4); margin-bottom: var(--md-sys-spacing-4);">
                        <div style="width: var(--md-sys-spacing-12); height: var(--md-sys-spacing-12); background: var(--md-sys-color-secondary-container); border-radius: var(--md-sys-shape-corner-medium); display: flex; align-items: center; justify-content: center;">
                            <span class="material-symbols-outlined" style="font-size: var(--md-sys-spacing-6); color: var(--md-sys-color-on-secondary-container);">
                                location_on
                            </span>
                        </div>
                        <div>
                            <div class="md-typescale-headline-large" style="color: var(--md-sys-color-on-surface);">
                                ${count}
                            </div>
                        </div>
                    </div>
                    <h3 class="md-typescale-body-large" style="color: var(--md-sys-color-on-surface); margin: 0 0 var(--md-sys-spacing-1) 0;">
                        ${district}
                    </h3>
                    <p class="md-typescale-body-small" style="color: var(--md-sys-color-on-surface-variant); margin: 0;">
                        ${percentage}% xodimlar
                    </p>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = cardsHTML;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadDashboardData);