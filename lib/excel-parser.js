const XLSX = require('xlsx');
const fs = require('fs').promises;

async function parseExcelFile(buffer) {
    try {
        // Read workbook from buffer
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        
        // Get first worksheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1, // Use array format
            defval: '', // Default value for empty cells
            raw: false // Get formatted strings
        });
        
        // Find header row
        let headerRowIndex = -1;
        for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            const rowStr = row.join(' ').toLowerCase();
            if (rowStr.includes('f.i.o') || rowStr.includes('telefon')) {
                headerRowIndex = i;
                break;
            }
        }
        
        if (headerRowIndex === -1) {
            throw new Error('Excel faylida sarlavha topilmadi');
        }
        
        // Extract employees data
        const employees = [];
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            
            // Skip empty rows
            if (!row || row.length < 7) continue;
            
            // Map based on column position
            const name = row[0] ? row[0].toString().trim() : '';
            const position = row[1] ? row[1].toString().trim() : '';
            const rank = row[2] ? row[2].toString().trim() : '';
            const department = row[3] ? row[3].toString().trim() : '';
            const phone = row[4] ? row[4].toString().trim() : '';
            const servicePhone = row[5] ? row[5].toString().trim() : '';
            const district = row[6] ? row[6].toString().trim() : '';
            
            // Skip if no name or phone
            if (!name || !phone) continue;
            
            // Skip sample data
            if (name.includes('Aliyev Vali Salimovich')) continue;
            
            // Clean phone number
            const cleanPhone = phone.replace(/\D/g, '');
            const formattedPhone = cleanPhone.length >= 9 ? cleanPhone.slice(-9) : cleanPhone;
            
            employees.push({
                name,
                position,
                rank,
                department,
                phoneNumber: formattedPhone,
                servicePhone: servicePhone.replace(/\D/g, ''),
                district
            });
        }
        
        return employees;
        
    } catch (error) {
        console.error('Excel parse error:', error);
        throw new Error('Excel faylni o\'qishda xatolik: ' + error.message);
    }
}

module.exports = {
    parseExcelFile
};