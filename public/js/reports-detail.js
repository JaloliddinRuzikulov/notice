// Export single broadcast to Excel
async function exportSingleBroadcast(broadcastId) {
    try {
        console.log('[EXPORT SINGLE] Starting export for broadcast:', broadcastId);
        
        // Check if XLSX is loaded
        if (typeof XLSX === 'undefined') {
            alert('Excel kutubxonasi yuklanmagan. Sahifani yangilang.');
            return;
        }
        
        // Fetch broadcast details
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
        if (!data.success) {
            throw new Error('Invalid response');
        }
        
        const broadcast = data.broadcast;
        
        // Fetch employees and departments data
        const [employeesResponse, departmentsResponse, districtsResponse] = await Promise.all([
            fetch('/api/employees', { 
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            }),
            fetch('/api/departments', { 
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            }),
            fetch('/api/districts-list', { 
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
        ]);
        
        // Check each response and parse carefully
        const responses = [
            { resp: employeesResponse, name: 'employees' },
            { resp: departmentsResponse, name: 'departments' },
            { resp: districtsResponse, name: 'districts' }
        ];
        
        const parsedData = {};
        
        for (const { resp, name } of responses) {
            const contentType = resp.headers.get('content-type');
            
            // Check if response is OK and is JSON
            if (!resp.ok || !contentType || !contentType.includes('application/json')) {
                console.error(`Failed to fetch ${name}:`, resp.status, contentType);
                
                if (resp.status === 401) {
                    window.location.href = '/login';
                    return;
                }
                
                if (resp.status === 403) {
                    throw new Error(`Access denied for ${name}`);
                }
                
                // If not JSON, throw error
                throw new Error(`Invalid response for ${name}`);
            }
            
            try {
                parsedData[name] = await resp.json();
            } catch (e) {
                console.error(`Failed to parse ${name} response:`, e);
                throw new Error(`Failed to parse ${name} data`);
            }
        }
        
        // Handle employees response which might be an object with employees array
        const employeesData = parsedData.employees || {};
        console.log('[EXPORT DEBUG] Employees data type:', typeof employeesData, 'isArray:', Array.isArray(employeesData));
        console.log('[EXPORT DEBUG] Employees data:', employeesData);
        
        let employees = [];
        if (employeesData.success && employeesData.employees) {
            employees = employeesData.employees;
        } else if (Array.isArray(employeesData)) {
            employees = employeesData;
        }
        console.log('[EXPORT DEBUG] Final employees array:', employees.length, 'items');
        
        // Handle departments response
        let departments = [];
        if (parsedData.departments) {
            if (parsedData.departments.departments) {
                departments = parsedData.departments.departments;
            } else if (Array.isArray(parsedData.departments)) {
                departments = parsedData.departments;
            }
        }
        
        // Handle districts response
        let districts = [];
        if (parsedData.districts) {
            if (parsedData.districts.districts) {
                districts = parsedData.districts.districts;
            } else if (Array.isArray(parsedData.districts)) {
                districts = parsedData.districts;
            }
        }
        
        // Create maps
        const deptMap = {};
        departments.forEach(dept => {
            deptMap[dept.id] = dept.name;
        });
        
        const distMap = {};
        districts.forEach(dist => {
            distMap[dist.id] = dist.name;
            distMap[dist.name] = dist.name;
        });
        
        // Prepare data for export
        const mainData = [];
        mainData.push(['Telefon qilingan xodimlar ro\'yxati']);
        mainData.push([]);
        mainData.push(['Xabar mavzusi:', broadcast.subject || 'Xabarnoma']);
        mainData.push(['Yuborilgan sana:', new Date(broadcast.createdAt).toLocaleString('uz-UZ')]);
        mainData.push(['Xabar turi:', broadcast.audioFile ? 'Audio xabar' : 'Matnli xabar']);
        if (broadcast.message) {
            mainData.push(['Xabar matni:', broadcast.message]);
        }
        mainData.push([]);
        mainData.push(['#', 'FIO', 'Bo\'limi', 'Unvoni', 'Tumani', 'Telefon', 'Urinish', 'Vaqt', 'Javob berdi', 'Tasdiqladi', 'Davomiylik']);
        
        let rowNum = 1;
        if (broadcast.callAttempts) {
            Object.entries(broadcast.callAttempts).forEach(([phoneNumber, attempts]) => {
                const employee = employees.find(emp => emp.phoneNumber === phoneNumber);
                
                if (employee) {
                    const deptName = deptMap[employee.department] || employee.department || '-';
                    const distName = distMap[employee.district] || employee.district || '-';
                    
                    attempts.forEach((attempt, index) => {
                        mainData.push([
                            rowNum++,
                            index === 0 ? employee.name : '',  // Show name only on first row
                            index === 0 ? deptName : '',       // Show department only on first row
                            index === 0 ? (employee.rank || '-') : '', // Show rank only on first row
                            index === 0 ? distName : '',       // Show district only on first row
                            index === 0 ? employee.phoneNumber : '', // Show phone only on first row
                            attempt.attemptNumber,
                            new Date(attempt.startTime).toLocaleTimeString('uz-UZ'),
                            attempt.answered ? 'Ha' : 'Yo\'q',
                            attempt.dtmfConfirmed ? 'Ha' : 'Yo\'q',
                            attempt.duration ? `${attempt.duration}s` : '-'
                        ]);
                    });
                    
                    // Add empty row between employees for better readability
                    if (attempts.length > 1) {
                        mainData.push([]);
                    }
                }
            });
        }
        
        // Add summary
        mainData.push([]);
        mainData.push(['Statistika:']);
        mainData.push(['Jami qabul qiluvchilar:', broadcast.statistics.totalRecipients]);
        mainData.push(['Jami qo\'ng\'iroqlar:', broadcast.statistics.totalCallAttempts]);
        mainData.push(['Javob berilgan:', broadcast.statistics.answeredCalls]);
        mainData.push(['Tasdiqlangan:', broadcast.statistics.confirmedCount]);
        mainData.push(['Tasdiqlanish foizi:', broadcast.statistics.confirmationRate]);
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(mainData);
        
        // Auto-fit column widths based on content
        const cols = [];
        const colCount = 11; // Total columns
        
        // Calculate max width for each column
        for (let i = 0; i < colCount; i++) {
            let maxWidth = 10; // Minimum width
            
            // Check all rows for this column
            for (let j = 0; j < mainData.length; j++) {
                if (mainData[j][i]) {
                    const cellLength = String(mainData[j][i]).length;
                    maxWidth = Math.max(maxWidth, cellLength + 2);
                }
            }
            
            // Set reasonable limits
            if (i === 0) maxWidth = Math.min(maxWidth, 8);   // # column
            else if (i === 1) maxWidth = Math.min(maxWidth, 30); // FIO
            else if (i === 2) maxWidth = Math.min(maxWidth, 25); // Bo'limi
            else maxWidth = Math.min(maxWidth, 20);
            
            cols.push({ wch: maxWidth });
        }
        
        ws['!cols'] = cols;
        
        // Add basic styling if supported
        try {
            const range = XLSX.utils.decode_range(ws['!ref']);
            
            // Style cells
            for (let R = range.s.r; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellAddress = {c: C, r: R};
                    const cellRef = XLSX.utils.encode_cell(cellAddress);
                    
                    if (!ws[cellRef]) continue;
                    if (!ws[cellRef].s) ws[cellRef].s = {};
                    
                    // Add borders
                    ws[cellRef].s.border = {
                        top: { style: 'thin' },
                        bottom: { style: 'thin' },
                        left: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                }
            }
        } catch (e) {
            // If styling fails, continue without it
            console.log('Styling not supported, exporting without borders');
        }
        
        // Merge title cells
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } });
        
        XLSX.utils.book_append_sheet(wb, ws, "Xabar hisoboti");
        
        // Generate filename
        const dateStr = new Date(broadcast.createdAt).toISOString().split('T')[0];
        const subject = broadcast.subject || 'Xabarnoma';
        const filename = `${subject.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.xlsx`;
        
        XLSX.writeFile(wb, filename);
        
    } catch (error) {
        console.error('Export error:', error);
        alert('Export qilishda xatolik yuz berdi: ' + error.message);
    }
}

// View detailed report in a new window
async function viewDetailedReport(broadcastId) {
    try {
        console.log('[VIEW DETAILED REPORT] Broadcast ID:', broadcastId);
        
        if (!broadcastId || broadcastId === 'undefined') {
            alert('Xatolik: Broadcast ID topilmadi');
            return;
        }
        
        // Fetch broadcast details
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
        if (!data.success) {
            throw new Error('Invalid response');
        }
        
        const broadcast = data.broadcast;
        
        // Fetch employees and departments data
        const [employeesResponse, departmentsResponse, districtsResponse] = await Promise.all([
            fetch('/api/employees', { 
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            }),
            fetch('/api/departments', { 
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            }),
            fetch('/api/districts-list', { 
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
        ]);
        
        // Check each response and parse carefully
        const responses = [
            { resp: employeesResponse, name: 'employees' },
            { resp: departmentsResponse, name: 'departments' },
            { resp: districtsResponse, name: 'districts' }
        ];
        
        const parsedData = {};
        
        for (const { resp, name } of responses) {
            const contentType = resp.headers.get('content-type');
            
            // Check if response is OK and is JSON
            if (!resp.ok || !contentType || !contentType.includes('application/json')) {
                console.error(`Failed to fetch ${name}:`, resp.status, contentType);
                
                if (resp.status === 401) {
                    window.location.href = '/login';
                    return;
                }
                
                if (resp.status === 403) {
                    throw new Error(`Access denied for ${name}`);
                }
                
                // If not JSON, throw error
                throw new Error(`Invalid response for ${name}`);
            }
            
            try {
                parsedData[name] = await resp.json();
            } catch (e) {
                console.error(`Failed to parse ${name} response:`, e);
                throw new Error(`Failed to parse ${name} data`);
            }
        }
        
        // Handle employees response which might be an object with employees array
        const employeesData = parsedData.employees || {};
        console.log('[EXPORT DEBUG] Employees data type:', typeof employeesData, 'isArray:', Array.isArray(employeesData));
        console.log('[EXPORT DEBUG] Employees data:', employeesData);
        
        let employees = [];
        if (employeesData.success && employeesData.employees) {
            employees = employeesData.employees;
        } else if (Array.isArray(employeesData)) {
            employees = employeesData;
        }
        console.log('[EXPORT DEBUG] Final employees array:', employees.length, 'items');
        
        // Handle departments response
        let departments = [];
        if (parsedData.departments) {
            if (parsedData.departments.departments) {
                departments = parsedData.departments.departments;
            } else if (Array.isArray(parsedData.departments)) {
                departments = parsedData.departments;
            }
        }
        
        // Handle districts response
        let districts = [];
        if (parsedData.districts) {
            if (parsedData.districts.districts) {
                districts = parsedData.districts.districts;
            } else if (Array.isArray(parsedData.districts)) {
                districts = parsedData.districts;
            }
        }
        
        // Create maps
        const deptMap = {};
        departments.forEach(dept => {
            deptMap[dept.id] = dept.name;
        });
        
        const distMap = {};
        districts.forEach(dist => {
            distMap[dist.id] = dist.name;
            distMap[dist.name] = dist.name;
        });
        
        // Create detailed HTML report
        const reportWindow = window.open('', '_blank');
        
        let tableRows = '';
        let rowNum = 1;
        
        if (broadcast.callAttempts) {
            Object.entries(broadcast.callAttempts).forEach(([phoneNumber, attempts]) => {
                const employee = employees.find(emp => emp.phoneNumber === phoneNumber);
                
                if (employee) {
                    const deptName = deptMap[employee.department] || employee.department || '-';
                    const distName = distMap[employee.district] || employee.district || '-';
                    
                    // First row - show employee info
                    const firstAttempt = attempts[0];
                    const firstAnswered = firstAttempt.answered ? '<span style="color: #10b981;">✓ Ha</span>' : '<span style="color: #ef4444;">✗ Yo\'q</span>';
                    const firstConfirmed = firstAttempt.dtmfConfirmed ? '<span style="color: #10b981;">✓ Ha</span>' : '<span style="color: #ef4444;">✗ Yo\'q</span>';
                    
                    tableRows += `
                        <tr>
                            <td rowspan="${attempts.length}">${rowNum++}</td>
                            <td rowspan="${attempts.length}">${employee.name}</td>
                            <td rowspan="${attempts.length}">${deptName}</td>
                            <td rowspan="${attempts.length}">${employee.rank || '-'}</td>
                            <td rowspan="${attempts.length}">${distName}</td>
                            <td rowspan="${attempts.length}">${employee.phoneNumber}</td>
                            <td style="text-align: center;">${firstAttempt.attemptNumber}</td>
                            <td>${new Date(firstAttempt.startTime).toLocaleTimeString('uz-UZ')}</td>
                            <td style="text-align: center;">${firstAnswered}</td>
                            <td style="text-align: center;">${firstConfirmed}</td>
                            <td style="text-align: center;">${firstAttempt.duration ? `${firstAttempt.duration}s` : '-'}</td>
                        </tr>
                    `;
                    
                    // Additional rows - only show attempt details
                    for (let i = 1; i < attempts.length; i++) {
                        const attempt = attempts[i];
                        const answered = attempt.answered ? '<span style="color: #10b981;">✓ Ha</span>' : '<span style="color: #ef4444;">✗ Yo\'q</span>';
                        const confirmed = attempt.dtmfConfirmed ? '<span style="color: #10b981;">✓ Ha</span>' : '<span style="color: #ef4444;">✗ Yo\'q</span>';
                        
                        tableRows += `
                            <tr>
                                <td style="text-align: center;">${attempt.attemptNumber}</td>
                                <td>${new Date(attempt.startTime).toLocaleTimeString('uz-UZ')}</td>
                                <td style="text-align: center;">${answered}</td>
                                <td style="text-align: center;">${confirmed}</td>
                                <td style="text-align: center;">${attempt.duration ? `${attempt.duration}s` : '-'}</td>
                            </tr>
                        `;
                    }
                }
            });
        }
        
        const html = `
            <!DOCTYPE html>
            <html lang="uz">
            <head>
                <meta charset="UTF-8">
                <title>${broadcast.subject || 'Xabarnoma'} - Batafsil hisobot</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        background: #f5f5f5;
                    }
                    .container {
                        max-width: 1400px;
                        margin: 0 auto;
                        background: white;
                        padding: 30px;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    h1 {
                        color: #1a73e8;
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .info-section {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                        margin-bottom: 30px;
                    }
                    .info-row {
                        display: flex;
                        margin-bottom: 10px;
                    }
                    .info-label {
                        font-weight: bold;
                        width: 200px;
                        color: #5f6368;
                    }
                    .info-value {
                        flex: 1;
                        color: #202124;
                    }
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 20px;
                        margin-bottom: 30px;
                    }
                    .stat-card {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                        text-align: center;
                        border: 1px solid #e8eaed;
                    }
                    .stat-value {
                        font-size: 36px;
                        font-weight: bold;
                        color: #1a73e8;
                        margin-bottom: 5px;
                    }
                    .stat-label {
                        color: #5f6368;
                        font-size: 14px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    th {
                        background: #1a73e8;
                        color: white;
                        padding: 12px;
                        text-align: left;
                        font-weight: 500;
                    }
                    td {
                        padding: 10px 12px;
                        border-bottom: 1px solid #e8eaed;
                    }
                    tr:nth-child(even) {
                        background: #f8f9fa;
                    }
                    tr:hover {
                        background: #e8f0fe;
                    }
                    td[rowspan] {
                        vertical-align: middle;
                        background: #f8f9fa;
                        font-weight: 500;
                        border-right: 2px solid #e8eaed;
                    }
                    .print-btn {
                        background: #1a73e8;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 16px;
                        margin-bottom: 20px;
                    }
                    .print-btn:hover {
                        background: #1765cc;
                    }
                    @media print {
                        .print-btn { display: none; }
                        body { margin: 0; background: white; }
                        .container { box-shadow: none; padding: 20px; }
                    }
                    .message-content {
                        background: #e3f2fd;
                        padding: 15px;
                        border-radius: 8px;
                        margin-top: 10px;
                        border-left: 4px solid #1a73e8;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <button class="print-btn" onclick="window.print()">
                        <i class="fas fa-print"></i> Chop etish
                    </button>
                    
                    <h1>${broadcast.subject || 'Xabarnoma'} - Batafsil hisobot</h1>
                    
                    <div class="info-section">
                        <div class="info-row">
                            <div class="info-label">Yuborilgan sana:</div>
                            <div class="info-value">${new Date(broadcast.createdAt).toLocaleString('uz-UZ')}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Xabar turi:</div>
                            <div class="info-value">${broadcast.audioFile ? 'Audio xabar' : 'Matnli xabar'}</div>
                        </div>
                        ${broadcast.message ? `
                            <div class="info-row">
                                <div class="info-label">Xabar matni:</div>
                                <div class="info-value">
                                    <div class="message-content">${broadcast.message}</div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${broadcast.statistics.totalRecipients}</div>
                            <div class="stat-label">Jami qabul qiluvchilar</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${broadcast.statistics.totalCallAttempts}</div>
                            <div class="stat-label">Jami qo'ng'iroqlar</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${broadcast.statistics.answeredCalls}</div>
                            <div class="stat-label">Javob berilgan</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${broadcast.statistics.confirmedCount}</div>
                            <div class="stat-label">Tasdiqlangan</div>
                        </div>
                    </div>
                    
                    <h2 style="margin-top: 40px;">Qo'ng'iroqlar tafsiloti</h2>
                    
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 40px;">#</th>
                                <th>FIO</th>
                                <th>Bo'limi</th>
                                <th>Unvoni</th>
                                <th>Tumani</th>
                                <th>Telefon</th>
                                <th style="width: 60px; text-align: center;">Urinish</th>
                                <th style="width: 80px;">Vaqt</th>
                                <th style="width: 100px; text-align: center;">Javob berdi</th>
                                <th style="width: 100px; text-align: center;">Tasdiqladi</th>
                                <th style="width: 80px; text-align: center;">Davomiylik</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            </body>
            </html>
        `;
        
        reportWindow.document.write(html);
        reportWindow.document.close();
        
    } catch (error) {
        console.error('View report error:', error);
        alert('Hisobotni ko\'rishda xatolik yuz berdi: ' + error.message);
    }
}

// Make functions globally accessible
window.exportSingleBroadcast = exportSingleBroadcast;
window.viewDetailedReport = viewDetailedReport;