// Simple Excel export function that works with basic XLSX library
async function exportToExcel(broadcasts) {
    try {
        // Check if XLSX is loaded
        if (typeof XLSX === 'undefined') {
            alert('Excel kutubxonasi yuklanmagan. Sahifani yangilang.');
            console.error('XLSX library not loaded');
            return;
        }
        
        // Fetch employees and departments data
        const [employeesResponse, departmentsResponse, districtsResponse] = await Promise.all([
            fetch('/api/employees', { credentials: 'same-origin' }),
            fetch('/api/departments', { credentials: 'same-origin' }),
            fetch('/api/districts-list', { credentials: 'same-origin' })
        ]);
        
        const employees = await employeesResponse.json();
        const departments = await departmentsResponse.json();
        const districts = await districtsResponse.json();
        
        // Create department and district maps
        const deptMap = {};
        departments.forEach(dept => {
            deptMap[dept.id] = dept.name;
        });
        
        const distMap = {};
        districts.forEach(dist => {
            distMap[dist.id] = dist.name;
            distMap[dist.name] = dist.name;
        });
        
        // Prepare data for main sheet
        const mainData = [];
        mainData.push(['Sana', 'Vaqt', 'Mavzu', 'Xabar turi', 'Xodim FIO', 'Bo\'limi', 'Unvoni', 'Tuman', 'Telefon', 'Javob berdi', 'Tasdiqladi', 'Qo\'ng\'iroq vaqti']);
        
        // Statistics counters
        let totalCalls = 0;
        let answeredCalls = 0;
        let confirmedCalls = 0;
        const deptStats = {};
        
        broadcasts.forEach(broadcast => {
            const date = new Date(broadcast.createdAt);
            const dateStr = date.toLocaleDateString('uz-UZ');
            const timeStr = date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
            const type = broadcast.audioFile ? 'Audio' : 'Matn';
            
            if (broadcast.callAttempts) {
                Object.entries(broadcast.callAttempts).forEach(([phoneNumber, attempts]) => {
                    const employee = employees.find(emp => emp.phoneNumber === phoneNumber);
                    
                    if (employee) {
                        const deptName = deptMap[employee.department] || employee.department || '-';
                        const distName = distMap[employee.district] || employee.district || '-';
                        
                        // Update department stats
                        if (!deptStats[deptName]) {
                            deptStats[deptName] = { total: 0, answered: 0, confirmed: 0 };
                        }
                        
                        attempts.forEach(attempt => {
                            totalCalls++;
                            const answered = attempt.answered ? 'Ha' : 'Yo\'q';
                            const confirmed = attempt.dtmfConfirmed ? 'Ha' : 'Yo\'q';
                            
                            if (attempt.answered) {
                                answeredCalls++;
                                deptStats[deptName].answered++;
                            }
                            if (attempt.dtmfConfirmed) {
                                confirmedCalls++;
                                deptStats[deptName].confirmed++;
                            }
                            deptStats[deptName].total++;
                            
                            mainData.push([
                                dateStr,
                                timeStr,
                                broadcast.subject || 'Xabarnoma',
                                type,
                                employee.name,
                                deptName,
                                employee.rank || '-',
                                distName,
                                employee.phoneNumber,
                                answered,
                                confirmed,
                                attempt.duration ? `${attempt.duration}s` : '-'
                            ]);
                        });
                    }
                });
            }
        });
        
        // Create summary data
        const summaryData = [];
        summaryData.push(['Qashqadaryo IIB Xabarnoma Tizimi - Hisobot']);
        summaryData.push([]);
        summaryData.push(['Hisobot sanasi:', new Date().toLocaleDateString('uz-UZ')]);
        summaryData.push(['Sana oralig\'i:', `${document.getElementById('startDate').value} - ${document.getElementById('endDate').value}`]);
        summaryData.push([]);
        summaryData.push(['Umumiy statistika:']);
        summaryData.push(['Jami xabarlar:', broadcasts.length]);
        summaryData.push(['Jami qo\'ng\'iroqlar:', totalCalls]);
        summaryData.push(['Javob berilgan:', answeredCalls]);
        summaryData.push(['Tasdiqlangan:', confirmedCalls]);
        summaryData.push([]);
        summaryData.push(['Bo\'limlar bo\'yicha statistika:']);
        summaryData.push(['Bo\'lim', 'Jami', 'Javob berdi', 'Tasdiqladi']);
        
        Object.entries(deptStats).forEach(([dept, stats]) => {
            summaryData.push([dept, stats.total, stats.answered, stats.confirmed]);
        });
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // Create main sheet
        const mainSheet = XLSX.utils.aoa_to_sheet(mainData);
        
        // Set column widths for main sheet
        mainSheet['!cols'] = [
            { wch: 12 }, // Sana
            { wch: 8 },  // Vaqt
            { wch: 30 }, // Mavzu
            { wch: 12 }, // Xabar turi
            { wch: 25 }, // Xodim FIO
            { wch: 20 }, // Bo'limi
            { wch: 18 }, // Unvoni
            { wch: 18 }, // Tuman
            { wch: 15 }, // Telefon
            { wch: 12 }, // Javob berdi
            { wch: 12 }, // Tasdiqladi
            { wch: 15 }  // Qo'ng'iroq vaqti
        ];
        
        // Add main sheet to workbook
        XLSX.utils.book_append_sheet(wb, mainSheet, "Xabar hisoboti");
        
        // Create summary sheet
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        
        // Set column widths for summary sheet
        summarySheet['!cols'] = [
            { wch: 30 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 }
        ];
        
        // Merge cells for title in summary sheet
        if (!summarySheet['!merges']) summarySheet['!merges'] = [];
        summarySheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } });
        
        // Add summary sheet to workbook
        XLSX.utils.book_append_sheet(wb, summarySheet, "Umumiy");
        
        // Generate Excel file
        XLSX.writeFile(wb, `Xabarnoma_hisobot_${new Date().toISOString().split('T')[0]}.xlsx`);
        
    } catch (error) {
        console.error('Export error:', error);
        alert('Export qilishda xatolik yuz berdi: ' + error.message);
    }
}

// Make function globally accessible
window.exportToExcel = exportToExcel;