// Reports functionality
let dailyChart = null;
let departmentChart = null;
let currentPage = 1;
const itemsPerPage = 10;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set default dates (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    
    // Load reports
    updateReports();
    
    // Check if user is admin before loading system stats
    const isAdmin = document.querySelector('.system-stats');
    if (isAdmin) {
        // Load system stats
        loadSystemStats();
        
        // Refresh system stats every 30 seconds
        setInterval(loadSystemStats, 30000);
    }
});

// Update reports
async function updateReports() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        alert('Iltimos, sanalarni tanlang');
        return;
    }
    
    // Reset to first page when updating
    currentPage = 1;
    
    // Load statistics
    await loadStatistics(startDate, endDate);
    
    // Load charts
    await loadCharts(startDate, endDate);
    
    // Load detailed report
    await loadDetailedReport(startDate, endDate);
}

// Load statistics
async function loadStatistics(startDate, endDate) {
    try {
        // Fetch all broadcasts to calculate statistics
        const response = await fetch('/api/broadcast/recent', {
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch statistics');
        }
        
        const broadcasts = await response.json();
        
        // Filter by date range
        const filteredBroadcasts = broadcasts.filter(broadcast => {
            const broadcastDate = new Date(broadcast.createdAt).toISOString().split('T')[0];
            return broadcastDate >= startDate && broadcastDate <= endDate;
        });
        
        // Calculate statistics
        let totalBroadcasts = filteredBroadcasts.length;
        let totalConfirmed = 0;
        let totalCalls = 0;
        let totalRecipients = 0;
        
        filteredBroadcasts.forEach(broadcast => {
            totalConfirmed += broadcast.confirmedCount || 0;
            totalRecipients += broadcast.totalRecipients || 0;
            
            // Count all call attempts
            if (broadcast.callAttempts) {
                Object.values(broadcast.callAttempts).forEach(attempts => {
                    totalCalls += attempts.length;
                });
            }
        });
        
        const confirmationRate = totalRecipients > 0 
            ? ((totalConfirmed / totalRecipients) * 100).toFixed(1)
            : 0;
        
        document.getElementById('totalBroadcasts').textContent = totalBroadcasts;
        document.getElementById('totalConfirmed').textContent = totalConfirmed;
        document.getElementById('totalCalls').textContent = totalCalls;
        document.getElementById('confirmationRate').textContent = confirmationRate + '%';
    } catch (error) {
        console.error('Error loading statistics:', error);
        // Show zeros on error
        document.getElementById('totalBroadcasts').textContent = '0';
        document.getElementById('totalConfirmed').textContent = '0';
        document.getElementById('totalCalls').textContent = '0';
        document.getElementById('confirmationRate').textContent = '0%';
    }
}

// Load charts
async function loadCharts(startDate, endDate) {
    try {
        // Fetch broadcasts for chart data
        const response = await fetch('/api/broadcast/recent', {
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch chart data');
        }
        
        const broadcasts = await response.json();
        
        // Filter by date range
        const filteredBroadcasts = broadcasts.filter(broadcast => {
            const broadcastDate = new Date(broadcast.createdAt).toISOString().split('T')[0];
            return broadcastDate >= startDate && broadcastDate <= endDate;
        });
        
        // Daily broadcasts chart
        loadDailyBroadcastsChart(filteredBroadcasts, startDate, endDate);
        
        // Department chart
        loadDepartmentChart(filteredBroadcasts);
    } catch (error) {
        console.error('Error loading charts:', error);
        // Load empty charts on error
        loadDailyBroadcastsChart([], startDate, endDate);
        loadDepartmentChart([]);
    }
}

// Load daily broadcasts chart
function loadDailyBroadcastsChart(broadcasts, startDate, endDate) {
    const ctx = document.getElementById('dailyBroadcastsChart').getContext('2d');
    
    // Destroy existing chart
    if (dailyChart) {
        dailyChart.destroy();
    }
    
    // Calculate daily broadcast counts
    const dailyCounts = {};
    broadcasts.forEach(broadcast => {
        const date = new Date(broadcast.createdAt).toISOString().split('T')[0];
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    
    // Generate labels and data for date range
    const labels = [];
    const data = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        labels.push(d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' }));
        data.push(dailyCounts[dateStr] || 0);
    }
    
    dailyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Xabarlar soni',
                data: data,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#9ca3af'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#9ca3af'
                    }
                }
            }
        }
    });
}

// Load department chart
function loadDepartmentChart(broadcasts) {
    const ctx = document.getElementById('departmentChart').getContext('2d');
    
    // Destroy existing chart
    if (departmentChart) {
        departmentChart.destroy();
    }
    
    // Calculate confirmation rates by department
    const departmentStats = {};
    
    // This would need employee-department mapping
    // For now, show a message
    const labels = ['Ma\'lumot yo\'q'];
    const data = [100];
    
    departmentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#3b82f6',
                    '#10b981',
                    '#f59e0b',
                    '#ef4444',
                    '#8b5cf6'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#9ca3af',
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + '%';
                        }
                    }
                }
            }
        }
    });
}

// Load detailed report
async function loadDetailedReport(startDate, endDate, page = 1) {
    try {
        // Fetch recent broadcasts from API
        const response = await fetch('/api/broadcast/recent', {
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch broadcasts');
        }
        
        const broadcasts = await response.json();
        
        // Filter by date range if needed
        const filteredBroadcasts = broadcasts.filter(broadcast => {
            const broadcastDate = new Date(broadcast.createdAt).toISOString().split('T')[0];
            return broadcastDate >= startDate && broadcastDate <= endDate;
        });
        
        const tbody = document.getElementById('reportTableBody');
        
        if (filteredBroadcasts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center">Ma\'lumot topilmadi</td></tr>';
            updatePagination(0, 0);
            return;
        }
        
        // Calculate pagination
        currentPage = page;
        const totalPages = Math.ceil(filteredBroadcasts.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedBroadcasts = filteredBroadcasts.slice(startIndex, endIndex);
        
        // Check if user is admin from the global variable or session
        const isAdmin = window.currentUser && window.currentUser.role === 'admin';
        
        tbody.innerHTML = paginatedBroadcasts.map(broadcast => {
            // console.log('[REPORT TABLE] Broadcast:', broadcast);
            const date = new Date(broadcast.createdAt);
            const dateStr = date.toLocaleDateString('uz-UZ');
            const timeStr = date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
            const type = broadcast.audioFile ? 'Audio xabar' : 'Matnli xabar';
            const percentage = broadcast.totalRecipients > 0 
                ? ((broadcast.confirmedCount || 0) / broadcast.totalRecipients * 100).toFixed(1)
                : 0;
            
            // Count total call attempts
            let totalCallAttempts = 0;
            if (broadcast.callAttempts) {
                Object.values(broadcast.callAttempts).forEach(attempts => {
                    totalCallAttempts += attempts.length;
                });
            }
            
            const creatorCell = isAdmin ? `<td>${broadcast.createdByName || 'Unknown'}</td>` : '';
            
            // Add action buttons (details for all users, delete for admin only)
            const actionButtons = `
                <td>
                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); showBroadcastDetails('${broadcast.id}')" title="Batafsil">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${isAdmin ? `
                        <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteBroadcast('${broadcast.id}')" title="O'chirish" style="margin-left: 5px;">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </td>
            `;
            
            return `
                <tr onclick="showBroadcastDetails('${broadcast.id}')" style="cursor: pointer;">
                    <td>${dateStr}</td>
                    <td>${timeStr}</td>
                    ${creatorCell}
                    <td>${broadcast.subject || 'Xabarnoma'}</td>
                    <td>${type}</td>
                    <td>${broadcast.totalRecipients || 0}</td>
                    <td>${totalCallAttempts}</td>
                    <td>${broadcast.confirmedCount || 0}</td>
                    <td>${percentage}%</td>
                    <td><span class="status-badge status-${broadcast.status}">${getStatusText(broadcast.status)}</span></td>
                    ${actionButtons}
                </tr>
            `;
        }).join('');
        
        // Update pagination
        updatePagination(filteredBroadcasts.length, totalPages);
    } catch (error) {
        console.error('Error loading detailed report:', error);
        const tbody = document.getElementById('reportTableBody');
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Xatolik yuz berdi</td></tr>';
    }
}

// Update pagination UI
function updatePagination(totalItems, totalPages) {
    const paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) {
        // Create pagination container if it doesn't exist
        const tableContainer = document.querySelector('.report-table');
        const paginationDiv = document.createElement('div');
        paginationDiv.id = 'paginationContainer';
        paginationDiv.className = 'pagination-container';
        tableContainer.appendChild(paginationDiv);
    }
    
    const container = document.getElementById('paginationContainer');
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<div class="pagination">';
    
    // Previous button
    if (currentPage > 1) {
        html += `<button class="pagination-btn" onclick="changePage(${currentPage - 1})">
                    <i class="material-symbols-outlined">navigate_before</i>
                 </button>`;
    }
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
        html += `<button class="pagination-btn" onclick="changePage(1)">1</button>`;
        if (startPage > 2) {
            html += '<span class="pagination-dots">...</span>';
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                         onclick="changePage(${i})">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += '<span class="pagination-dots">...</span>';
        }
        html += `<button class="pagination-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    if (currentPage < totalPages) {
        html += `<button class="pagination-btn" onclick="changePage(${currentPage + 1})">
                    <i class="material-symbols-outlined">navigate_next</i>
                 </button>`;
    }
    
    html += '</div>';
    
    // Add items info
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    html += `<div class="pagination-info">${startItem}-${endItem} / ${totalItems} ta xabar</div>`;
    
    container.innerHTML = html;
}

// Change page
function changePage(page) {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    loadDetailedReport(startDate, endDate, page);
}

// Show broadcast details
async function showBroadcastDetails(broadcastId) {
    try {
        // console.log('[SHOW BROADCAST DETAILS] Broadcast ID:', broadcastId);
        
        if (!broadcastId || broadcastId === 'undefined') {
            alert('Xatolik: Broadcast ID topilmadi');
            return;
        }
        
        const response = await fetch(`/api/broadcast/report/${broadcastId}`, {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (!response.ok) {
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch broadcast details');
            } else {
                // If HTML response (likely login page), redirect to login
                if (response.status === 401) {
                    window.location.href = '/login';
                    return;
                }
                throw new Error('Failed to fetch broadcast details');
            }
        }
        
        const data = await response.json();
        if (data.success) {
            const broadcast = data.broadcast;
            
            // Create modal content
            const modalContent = `
                <div class="broadcast-details">
                    <h3>Xabar tafsilotlari</h3>
                    <div class="detail-section">
                        <h4>Umumiy ma'lumotlar</h4>
                        <p><strong>Mavzu:</strong> ${broadcast.subject || 'Xabarnoma'}</p>
                        <p><strong>Yaratilgan:</strong> ${new Date(broadcast.createdAt).toLocaleString('uz-UZ')}</p>
                        <p><strong>Holat:</strong> ${getStatusText(broadcast.status)}</p>
                        <p><strong>Jami qabul qiluvchilar:</strong> ${broadcast.statistics.totalRecipients}</p>
                        <p><strong>Tasdiqlangan:</strong> ${broadcast.statistics.confirmedCount} (${broadcast.statistics.confirmationRate})</p>
                        <p><strong>Jami qo'ng'iroqlar:</strong> ${broadcast.statistics.totalCallAttempts}</p>
                        <p><strong>Javob berilgan:</strong> ${broadcast.statistics.answeredCalls}</p>
                        <p><strong>Muvaffaqiyatsiz:</strong> ${broadcast.statistics.failedCalls}</p>
                        <p><strong>O'rtacha davomiylik:</strong> ${broadcast.statistics.averageCallDuration}</p>
                        
                        ${broadcast.audioFile ? `
                            <div style="margin-top: 15px;">
                                <strong>Audio xabar:</strong><br>
                                <audio controls style="margin-top: 10px; width: 100%;">
                                    <source src="/audio/uploads/${broadcast.audioFile}" type="audio/webm">
                                    <source src="/audio/uploads/${broadcast.audioFile}" type="audio/mpeg">
                                    Your browser does not support the audio element.
                                </audio>
                            </div>
                        ` : ''}
                        
                        ${broadcast.message ? `
                            <div class="message-field">
                                <p><strong>Xabar matni:</strong></p>
                                <div class="message-content">${broadcast.message}</div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="detail-section" style="text-align: center; margin-bottom: 20px;">
                        <button class="btn btn-primary" onclick="exportSingleBroadcast('${broadcast.id}')" style="margin-right: 10px;">
                            <i class="fas fa-file-excel"></i> Excel yuklash
                        </button>
                        <button class="btn btn-secondary" onclick="viewDetailedReport('${broadcast.id}')">
                            <i class="fas fa-eye"></i> Batafsil ko'rish
                        </button>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Qo'ng'iroq urinishlari</h4>
                        <div class="call-attempts-list">
                            ${Object.entries(broadcast.callAttempts || {}).map(([phone, attempts]) => `
                                <div class="phone-attempts">
                                    <h5>${phone}</h5>
                                    <table class="attempts-table">
                                        <tr>
                                            <th>Urinish</th>
                                            <th>Vaqt</th>
                                            <th>Javob</th>
                                            <th>DTMF</th>
                                            <th>Davomiylik</th>
                                            <th>Holat</th>
                                        </tr>
                                        ${attempts.map(attempt => `
                                            <tr>
                                                <td>${attempt.attemptNumber}</td>
                                                <td>${new Date(attempt.startTime).toLocaleTimeString('uz-UZ')}</td>
                                                <td>${attempt.answered ? '<span style="color: #10b981;">✓</span>' : '<span style="color: #ef4444;">✗</span>'}</td>
                                                <td>${attempt.dtmfConfirmed ? '<span style="color: #10b981;">✓</span>' : '<span style="color: #ef4444;">✗</span>'}</td>
                                                <td>${attempt.duration}s</td>
                                                <td><span class="status-badge status-${attempt.status}">${getStatusText(attempt.status)}</span></td>
                                            </tr>
                                        `).join('')}
                                    </table>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    ${broadcast.smsResults && broadcast.smsResults.length > 0 ? `
                        <div class="detail-section">
                            <h4><i class="fas fa-sms"></i> SMS yuborilganlar (5 marta javob bermaganlar)</h4>
                            <table class="attempts-table">
                                <tr>
                                    <th>Xodim</th>
                                    <th>Telefon raqam</th>
                                    <th>Yuborilgan vaqt</th>
                                    <th>Holat</th>
                                </tr>
                                ${broadcast.smsResults.map(sms => `
                                    <tr>
                                        <td>${sms.employeeName}</td>
                                        <td>${sms.phoneNumber}</td>
                                        <td>${new Date(sms.sentAt).toLocaleString('uz-UZ')}</td>
                                        <td>
                                            ${sms.status === 'sent' 
                                                ? '<span style="color: #10b981;">✓ Yuborildi</span>' 
                                                : `<span style="color: #ef4444;">✗ Xato: ${sms.error || 'Noma\'lum'}</span>`
                                            }
                                        </td>
                                    </tr>
                                `).join('')}
                            </table>
                        </div>
                    ` : ''}
                </div>
            `;
            
            // Create and show modal
            showDetailModal(modalContent);
        }
    } catch (error) {
        console.error('Error fetching broadcast details:', error);
        alert('Tafsilotlarni yuklashda xatolik');
    }
}

// Load employee report
async function loadEmployeeReport(startDate, endDate) {
    try {
        // Fetch employees and broadcasts
        const [employeesResponse, broadcastsResponse] = await Promise.all([
            fetch('/api/employees', { credentials: 'same-origin' }),
            fetch('/api/broadcast/recent', { credentials: 'same-origin' })
        ]);
        
        if (!employeesResponse.ok || !broadcastsResponse.ok) {
            throw new Error('Failed to fetch data');
        }
        
        const employees = await employeesResponse.json();
        const broadcasts = await broadcastsResponse.json();
        
        // Filter broadcasts by date
        const filteredBroadcasts = broadcasts.filter(broadcast => {
            const broadcastDate = new Date(broadcast.createdAt).toISOString().split('T')[0];
            return broadcastDate >= startDate && broadcastDate <= endDate;
        });
        
        // Calculate employee statistics
        const employeeStats = {};
        
        filteredBroadcasts.forEach(broadcast => {
            // Count confirmations
            (broadcast.confirmations || []).forEach(conf => {
                const empId = conf.employeeId;
                if (!employeeStats[empId]) {
                    employeeStats[empId] = { confirmations: 0, total: 0, missed: 0 };
                }
                employeeStats[empId].confirmations++;
            });
            
            // Count total broadcasts for each employee
            (broadcast.employeeIds || []).forEach(empId => {
                if (!employeeStats[empId]) {
                    employeeStats[empId] = { confirmations: 0, total: 0, missed: 0 };
                }
                employeeStats[empId].total++;
            });
        });
        
        // Calculate percentages and sort
        const employeeList = [];
        Object.keys(employeeStats).forEach(empId => {
            const stats = employeeStats[empId];
            const employee = employees.find(e => e.id === empId);
            if (employee) {
                const percentage = stats.total > 0 ? (stats.confirmations / stats.total * 100) : 0;
                employeeList.push({
                    id: empId,
                    name: employee.name,
                    confirmations: stats.confirmations,
                    total: stats.total,
                    percentage: percentage.toFixed(1),
                    missed: stats.total - stats.confirmations
                });
            }
        });
        
        // Sort by confirmation percentage
        employeeList.sort((a, b) => b.percentage - a.percentage);
        
        // Top employees
        const topEmployees = employeeList.slice(0, 5).filter(e => e.percentage > 0);
        document.getElementById('topEmployees').innerHTML = topEmployees.length > 0 ? topEmployees.map(emp => `
            <li>
                <span>${emp.name}</span>
                <span>${emp.confirmations}/${emp.total} (${emp.percentage}%)</span>
            </li>
        `).join('') : '<li>Ma\'lumot yo\'q</li>';
        
        // Unresponsive employees
        const unresponsiveEmployees = employeeList.filter(e => e.missed > 0).sort((a, b) => b.missed - a.missed).slice(0, 5);
        document.getElementById('unresponsiveEmployees').innerHTML = unresponsiveEmployees.length > 0 ? unresponsiveEmployees.map(emp => `
            <li>
                <span>${emp.name}</span>
                <span>${emp.missed} marta</span>
            </li>
        `).join('') : '<li>Ma\'lumot yo\'q</li>';
    } catch (error) {
        console.error('Error loading employee report:', error);
        document.getElementById('topEmployees').innerHTML = '<li>Yuklanishda xatolik</li>';
        document.getElementById('unresponsiveEmployees').innerHTML = '<li>Yuklanishda xatolik</li>';
    }
}

// Format date
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('uz-UZ');
}

// Get status text
function getStatusText(status) {
    const statusMap = {
        'completed': 'Tugallangan',
        'active': 'Faol',
        'in_progress': 'Jarayonda',
        'pending': 'Kutilmoqda',
        'failed': 'Xato'
    };
    return statusMap[status] || status;
}

// Delete broadcast function
async function deleteBroadcast(broadcastId) {
    if (!confirm('Haqiqatan ham ushbu xabarni o\'chirmoqchimisiz?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/broadcast/delete/${broadcastId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Xabar muvaffaqiyatli o\'chirildi');
            // Reload page to refresh all data
            window.location.reload();
        } else {
            alert(data.message || 'Xabarni o\'chirishda xatolik yuz berdi');
        }
    } catch (error) {
        console.error('Error deleting broadcast:', error);
        alert('Xabarni o\'chirishda xatolik yuz berdi');
    }
}

// Export report
async function exportReport(format) {
    try {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        // Fetch data
        const response = await fetch('/api/broadcast/recent', {
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        
        const broadcasts = await response.json();
        
        // Filter by date range
        const filteredBroadcasts = broadcasts.filter(broadcast => {
            const broadcastDate = new Date(broadcast.createdAt).toISOString().split('T')[0];
            return broadcastDate >= startDate && broadcastDate <= endDate;
        });
        
        if (format === 'excel') {
            exportToExcel(filteredBroadcasts);
        } else if (format === 'pdf') {
            exportToPDF(filteredBroadcasts);
        }
    } catch (error) {
        console.error('Export error:', error);
        alert('Export qilishda xatolik yuz berdi');
    }
}

// Export to PDF
function exportToPDF(broadcasts) {
    // Create print-friendly HTML
    const printWindow = window.open('', '_blank');
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Xabarnoma Hisoboti</title>
            <style>
                body { font-family: Arial, sans-serif; }
                h1 { text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .summary { margin: 20px 0; }
                .summary p { margin: 5px 0; }
            </style>
        </head>
        <body>
            <h1>Xabarnoma Tizimi Hisoboti</h1>
            <div class="summary">
                <p><strong>Sana oralig'i:</strong> ${document.getElementById('startDate').value} - ${document.getElementById('endDate').value}</p>
                <p><strong>Jami xabarlar:</strong> ${broadcasts.length}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Sana</th>
                        <th>Vaqt</th>
                        <th>Mavzu</th>
                        <th>Turi</th>
                        <th>Qabul qiluvchilar</th>
                        <th>Qo'ng'iroqlar</th>
                        <th>Tasdiqlandi</th>
                        <th>Foiz</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${broadcasts.map(broadcast => {
                        const date = new Date(broadcast.createdAt);
                        const dateStr = date.toLocaleDateString('uz-UZ');
                        const timeStr = date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
                        const type = broadcast.audioFile ? 'Audio' : 'Matn';
                        
                        let totalCallAttempts = 0;
                        if (broadcast.callAttempts) {
                            Object.values(broadcast.callAttempts).forEach(attempts => {
                                totalCallAttempts += attempts.length;
                            });
                        }
                        
                        const percentage = broadcast.totalRecipients > 0 
                            ? ((broadcast.confirmedCount || 0) / broadcast.totalRecipients * 100).toFixed(1)
                            : 0;
                        
                        return `
                            <tr>
                                <td>${dateStr}</td>
                                <td>${timeStr}</td>
                                <td>${broadcast.subject || 'Xabarnoma'}</td>
                                <td>${type}</td>
                                <td>${broadcast.totalRecipients || 0}</td>
                                <td>${totalCallAttempts}</td>
                                <td>${broadcast.confirmedCount || 0}</td>
                                <td>${percentage}%</td>
                                <td>${getStatusText(broadcast.status)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            <script>
                window.onload = function() {
                    window.print();
                    window.onafterprint = function() {
                        window.close();
                    };
                };
            </script>
        </body>
        </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

// Print report
function printReport() {
    window.print();
}

// Show detail modal
function showDetailModal(content) {
    // Remove existing modal if any
    const existingModal = document.getElementById('detailModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'detailModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Batafsil ma'lumot</h2>
                <button class="modal-close-btn" onclick="closeDetailModal()" aria-label="Yopish">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;
    
    // Add styles following Material Design 3 guidelines (only once)
    if (!document.getElementById('modal-styles')) {
        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
        /* MD3 Dialog Backdrop */
        .modal {
            display: block !important;
            position: fixed;
            z-index: 2400;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0, 0, 0, 0.32);
            backdrop-filter: blur(1px);
            animation: md-fade-in var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-emphasized-decelerate);
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        /* MD3 Dialog Container */
        .modal-content {
            background-color: var(--md-sys-color-surface-container-high);
            margin: 40px auto;
            padding: 0;
            width: calc(100% - 80px);
            min-width: 320px;
            max-width: 900px;
            border-radius: var(--md-sys-shape-corner-extra-large);
            max-height: calc(100vh - 80px);
            display: flex;
            flex-direction: column;
            box-shadow: var(--md-sys-elevation-level3);
            animation: md-slide-up var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-emphasized-decelerate);
        }
        
        /* MD3 Dialog Header */
        .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 32px 40px 24px 40px;
            flex-shrink: 0;
            border-bottom: 2px solid var(--md-sys-color-outline-variant);
            background: var(--md-sys-color-surface-container);
            border-radius: var(--md-sys-shape-corner-extra-large) var(--md-sys-shape-corner-extra-large) 0 0;
        }
        
        .modal-title {
            margin: 0;
            padding: 8px 0;
            font-size: var(--md-sys-typescale-headline-small-size);
            font-weight: var(--md-sys-typescale-headline-small-weight);
            line-height: var(--md-sys-typescale-headline-small-line-height);
            color: var(--md-sys-color-on-surface);
            letter-spacing: 0.5px;
        }
        
        .modal-close-btn {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: none;
            border: none;
            cursor: pointer;
            border-radius: var(--md-sys-shape-corner-full);
            color: var(--md-sys-color-on-surface-variant);
            transition: background-color var(--md-sys-motion-duration-short3);
            margin-left: var(--md-spacing-4);
        }
        
        .modal-close-btn:hover {
            background-color: var(--md-sys-color-on-surface-variant);
            background-color: color-mix(in srgb, var(--md-sys-color-on-surface-variant) 8%, transparent);
        }
        
        .modal-close-btn:active {
            background-color: var(--md-sys-color-on-surface-variant);
            background-color: color-mix(in srgb, var(--md-sys-color-on-surface-variant) 12%, transparent);
        }
        
        .modal-close-btn .material-symbols-outlined {
            font-size: 20px;
        }
        
        /* MD3 Dialog Body */
        .modal-body {
            padding: 60px 60px 50px 60px;
            overflow-y: auto;
            flex: 1;
        }
        
        /* MD3 Dialog Content */
        .broadcast-details {
            margin: 0;
            padding: 0 20px;
        }
        
        .broadcast-details h3 {
            color: var(--md-sys-color-on-surface);
            margin: 0 0 48px 0;
            padding: 0 35px 24px 35px;
            font-size: var(--md-sys-typescale-title-large-size);
            font-weight: var(--md-sys-typescale-title-large-weight);
            line-height: var(--md-sys-typescale-title-large-line-height);
            border-bottom: 2px solid var(--md-sys-color-outline-variant);
            letter-spacing: 0.3px;
        }
        
        .detail-section {
            margin: 0 0 64px 0;
            padding: 0 30px;
        }
        
        .detail-section:last-child {
            margin-bottom: 0;
        }
        
        .detail-section h4 {
            color: var(--md-sys-color-on-surface);
            margin: 0 0 40px 0;
            padding: 16px 25px;
            font-size: var(--md-sys-typescale-title-medium-size);
            font-weight: var(--md-sys-typescale-title-medium-weight);
            line-height: var(--md-sys-typescale-title-medium-line-height);
            border-bottom: 1px solid var(--md-sys-color-outline-variant);
            letter-spacing: 0.3px;
        }
        
        .detail-section p {
            margin: 0 0 40px 0;
            padding: 0 25px;
            color: var(--md-sys-color-on-surface);
            font-size: var(--md-sys-typescale-body-large-size);
            line-height: 2.4;
            display: flex;
            align-items: center;
        }
        
        .detail-section p:last-child {
            margin-bottom: 0;
        }
        
        .detail-section p strong {
            color: var(--md-sys-color-on-surface);
            font-weight: var(--md-sys-typescale-label-large-weight);
            display: inline-block;
            margin-right: 40px;
            min-width: 280px;
            flex-shrink: 0;
        }
        
        /* Message field styling */
        .message-field {
            margin: 0 0 40px 0;
            padding: 0 25px;
        }
        
        .message-field p {
            margin: 0 0 16px 0;
            padding: 0;
            color: var(--md-sys-color-on-surface);
            font-size: var(--md-sys-typescale-body-large-size);
            line-height: 2.4;
        }
        
        .message-field p strong {
            color: var(--md-sys-color-on-surface);
            font-weight: var(--md-sys-typescale-label-large-weight);
        }
        
        .message-content {
            color: var(--md-sys-color-on-surface);
            font-size: var(--md-sys-typescale-body-large-size);
            line-height: 2.4;
            padding: 20px;
            background: var(--md-sys-color-surface-container-lowest);
            border-radius: 12px;
            border: 1px solid var(--md-sys-color-outline-variant);
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        .phone-attempts {
            margin: 48px 0;
            padding: 0 35px;
        }
        
        .phone-attempts h5 {
            color: var(--md-sys-color-on-surface);
            margin: 0 0 32px 0;
            padding: 16px 35px;
            font-size: var(--md-sys-typescale-title-medium-size);
            font-weight: var(--md-sys-typescale-title-medium-weight);
            line-height: var(--md-sys-typescale-title-medium-line-height);
            border-bottom: 2px solid var(--md-sys-color-outline-variant);
            letter-spacing: 0.3px;
        }
        
        /* MD3 Data Table */
        .attempts-table {
            width: calc(100% - 70px);
            margin: 24px 35px 0 35px;
            border-collapse: separate;
            border-spacing: 0;
            background: var(--md-sys-color-surface);
            border-radius: var(--md-sys-shape-corner-large);
            overflow: hidden;
            border: 1px solid var(--md-sys-color-outline-variant);
        }
        
        .attempts-table th {
            background: var(--md-sys-color-surface-container);
            padding: 20px 16px;
            text-align: left;
            border-bottom: 1px solid var(--md-sys-color-outline-variant);
            color: var(--md-sys-color-on-surface);
            font-size: var(--md-sys-typescale-label-large-size);
            font-weight: var(--md-sys-typescale-label-large-weight);
            line-height: var(--md-sys-typescale-label-large-line-height);
            white-space: nowrap;
        }
        
        .attempts-table th:first-child {
            padding-left: 32px;
        }
        
        .attempts-table th:last-child {
            padding-right: 32px;
        }
        
        .attempts-table td {
            padding: 18px 16px;
            border-bottom: 1px solid var(--md-sys-color-outline-variant);
            color: var(--md-sys-color-on-surface-variant);
            font-size: var(--md-sys-typescale-body-medium-size);
            line-height: 1.8;
        }
        
        .attempts-table td:first-child {
            padding-left: 32px;
        }
        
        .attempts-table td:last-child {
            padding-right: 32px;
        }
        
        .attempts-table tbody tr {
            transition: background-color var(--md-sys-motion-duration-short3);
        }
        
        .attempts-table tbody tr:hover td {
            background-color: var(--md-sys-color-on-surface);
            background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 4%, transparent);
        }
        
        .attempts-table tr:last-child td {
            border-bottom: none;
        }
        
        /* Animations */
        @keyframes md-fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes md-slide-up {
            from { 
                transform: translateY(30px) scale(0.95);
                opacity: 0;
            }
            to { 
                transform: translateY(0) scale(1);
                opacity: 1;
            }
        }
        
        /* Responsive */
        @media (max-width: 600px) {
            .modal-content {
                margin: 0;
                width: 100%;
                max-width: 100%;
                min-height: 100%;
                max-height: 100%;
                border-radius: 0;
            }
        }
    `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(modal);
    
    // Close modal on outside click
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeDetailModal();
        }
    };
}

// Close detail modal
function closeDetailModal() {
    const modal = document.getElementById('detailModal');
    if (modal) {
        modal.remove();
    }
}

// Load system statistics
async function loadSystemStats() {
    try {
        const response = await fetch('/api/system/stats', {
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch system stats');
        }
        
        const stats = await response.json();
        
        // Update memory stats
        const memoryPercent = stats.memory.usagePercent;
        document.getElementById('memoryUsage').textContent = memoryPercent + '% band';
        document.getElementById('memoryDetails').textContent = 
            `Band: ${formatBytes(stats.memory.used)} | Bo'sh: ${formatBytes(stats.memory.free)}`;
        document.getElementById('memoryBar').style.width = memoryPercent + '%';
        
        // Set color based on usage
        const memoryBar = document.getElementById('memoryBar');
        if (memoryPercent > 80) {
            memoryBar.style.background = '#ef4444'; // Red
        } else if (memoryPercent > 60) {
            memoryBar.style.background = '#f59e0b'; // Orange
        } else {
            memoryBar.style.background = '#9333ea'; // Purple
        }
        
        // Update disk stats - use dataDisk if available (mounted), otherwise use root disk
        const diskStats = stats.dataDisk && stats.dataDisk.mounted ? stats.dataDisk : stats.disk;
        const diskPercent = diskStats.usagePercent;
        document.getElementById('diskUsage').textContent = diskPercent + '% band';
        document.getElementById('diskDetails').textContent = 
            `Band: ${formatBytes(diskStats.used)} | Bo'sh: ${formatBytes(diskStats.available)}`;
        document.getElementById('diskBar').style.width = diskPercent + '%';
        
        // Set color based on usage
        const diskBar = document.getElementById('diskBar');
        if (diskPercent > 80) {
            diskBar.style.background = '#ef4444'; // Red
        } else if (diskPercent > 60) {
            diskBar.style.background = '#f59e0b'; // Orange
        } else {
            diskBar.style.background = '#ec4899'; // Pink
        }
        
        // Update CPU stats
        document.getElementById('cpuInfo').textContent = stats.cpu.cores + ' yadro';
        document.getElementById('cpuDetails').textContent = stats.cpu.model.split(' ').slice(0, 3).join(' ');
        
        // Update uptime
        document.getElementById('uptime').textContent = formatUptime(stats.system.uptime);
        document.getElementById('loadAverage').textContent = 
            `Yuk: ${stats.system.loadAverage.map(n => n.toFixed(2)).join(', ')}`;
        
    } catch (error) {
        console.error('Error loading system stats:', error);
    }
}

// Format bytes to human readable
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format uptime to human readable
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
        return `${days} kun ${hours} soat`;
    } else if (hours > 0) {
        return `${hours} soat ${minutes} daqiqa`;
    } else {
        return `${minutes} daqiqa`;
    }
}

// Make functions globally accessible
window.showBroadcastDetails = showBroadcastDetails;
window.closeDetailModal = closeDetailModal;
window.deleteBroadcast = deleteBroadcast;
window.updateReports = updateReports;
window.exportReport = exportReport;
window.printReport = printReport;
// exportSingleBroadcast and viewDetailedReport are defined in reports-detail.js