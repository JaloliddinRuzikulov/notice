// XLSX Import Handler with SheetJS CDN
async function handleXLSXImport(file) {
    return new Promise((resolve, reject) => {
        // Check if SheetJS is loaded
        if (typeof XLSX === 'undefined') {
            // Load SheetJS from local file (offline compatible)
            const script = document.createElement('script');
            script.src = '/js/libs/xlsx.full.min.js';
            script.onload = () => {
                processXLSXFile(file, resolve, reject);
            };
            script.onerror = () => {
                reject(new Error('SheetJS kutubxonasini yuklab bo\'lmadi'));
            };
            document.head.appendChild(script);
        } else {
            processXLSXFile(file, resolve, reject);
        }
    });
}

function processXLSXFile(file, resolve, reject) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Get first sheet
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                header: 1,  // Use array format
                defval: ''  // Default value for empty cells
            });
            
            console.log('XLSX parsed, rows:', jsonData.length);
            
            const employees = [];
            let headerRow = -1;
            
            // Find header row
            for (let i = 0; i < Math.min(10, jsonData.length); i++) {
                const row = jsonData[i];
                if (!row || row.length === 0) continue;
                
                const rowText = row.join(' ').toLowerCase();
                if (rowText.includes('f.i.o') || rowText.includes('ism') || 
                    rowText.includes('telefon') || rowText.includes('lavozim')) {
                    headerRow = i;
                    console.log('Found header at row', i, ':', row);
                    break;
                }
            }
            
            if (headerRow === -1) {
                console.warn('Header not found, assuming first row is header');
                headerRow = 0;
            }
            
            // Process data rows
            let processedCount = 0;
            let skippedCount = 0;
            
            for (let i = headerRow + 1; i < jsonData.length && processedCount < 2000; i++) {
                const row = jsonData[i];
                if (!row || row.length < 5) {
                    skippedCount++;
                    continue;
                }
                
                // Debug first few rows
                if (i <= headerRow + 3) {
                    console.log(`Row ${i}:`, row);
                }
                
                // Your template doesn't have № column, so:
                // 0: F.I.O
                // 1: Lavozimi (position)  
                // 2: Unvoni (rank)
                // 3: Bo'limi (department)
                // 4: Telefon
                // 5: Xizmat telefoni (service phone)
                // 6: Tumani (district)
                
                // Get values with correct indices
                const name = (row[0] || '').toString().trim();
                const position = (row[1] || '').toString().trim();
                const rank = (row[2] || '').toString().trim();
                const department = (row[3] || '').toString().trim();
                const phone = (row[4] || '').toString().trim();
                const servicePhone = (row[5] || '').toString().trim();
                const district = (row[6] || '').toString().trim();
                
                // Skip empty rows or header-like rows
                if (!name || name === 'F.I.O' || name === 'Ism' || 
                    name.toLowerCase().includes('f.i.o')) {
                    skippedCount++;
                    if (i <= headerRow + 5) {
                        console.log(`Skipped row ${i}: name="${name}"`);
                    }
                    continue;
                }
                
                // Check phone
                if (!phone) {
                    skippedCount++;
                    if (i <= headerRow + 5) {
                        console.log(`Skipped row ${i}: no phone, name="${name}"`);
                    }
                    continue;
                }
                
                // Clean and validate phone number
                const cleanPhone = phone.toString().replace(/\D/g, '');
                let formattedPhone = cleanPhone;
                
                // Remove country code if present
                if (cleanPhone.startsWith('998')) {
                    formattedPhone = cleanPhone.substring(3);
                } else if (cleanPhone.startsWith('0')) {
                    formattedPhone = cleanPhone.substring(1);
                } else if (cleanPhone.length > 9) {
                    formattedPhone = cleanPhone.slice(-9);
                }
                
                // Validate phone length
                if (formattedPhone.length < 7 || formattedPhone.length > 9) {
                    console.log('Invalid phone for', name, ':', phone, '->', formattedPhone);
                    skippedCount++;
                    continue;
                }
                
                // Add employee
                employees.push({
                    name: name,
                    position: position,
                    rank: rank,
                    department: department,
                    phoneNumber: formattedPhone,
                    servicePhone: servicePhone.replace(/\D/g, '').slice(-9) || '',
                    district: district
                });
                
                processedCount++;
                
                if (processedCount <= 5) {
                    console.log(`Employee ${processedCount}:`, name, 'Phone:', formattedPhone, 'District:', district);
                }
            }
            
            console.log(`Processed ${processedCount} employees, skipped ${skippedCount} rows`);
            resolve(employees);
            
        } catch (error) {
            console.error('XLSX parsing error:', error);
            reject(error);
        }
    };
    
    reader.onerror = function(error) {
        reject(error);
    };
    
    // Read as ArrayBuffer for XLSX
    reader.readAsArrayBuffer(file);
}

// Export for use in employees.js
window.handleXLSXImport = handleXLSXImport;