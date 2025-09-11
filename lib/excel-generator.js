const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs').promises;

async function generateExcelTemplate() {
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Header data
    const headers = [
        'F.I.O',
        'Lavozimi',
        'Unvoni', 
        'Bo\'limi',
        'Telefon',
        'Xizmat Telefoni',
        'Tumani'
    ];
    
    // Sample data
    const sampleData = [
        ['Aliyev Vali Salimovich', 'Bosh inspektor', 'Mayor', 'Jamoat xavfsizligi', '991234567', '752001122', 'Qarshi shahri'],
        ['', '', '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '']
    ];
    
    // Districts list for reference
    const districts = [
        'Qarshi shahri',
        'Shahrisabz shahri',
        'Dehqonobod tumani',
        'Kasbi tumani',
        'Kitob tumani',
        'Koson tumani',
        'Ko\'kdala tumani',
        'Mirishkor tumani',
        'Muborak tumani',
        'Nishon tumani',
        'Qamashi tumani',
        'Yakkabog\' tumani',
        'G\'uzor tumani',
        'Shahrisabz tumani',
        'Chiroqchi tumani',
        'Viloyat IIB',
        'Patrul Post Xizmati',
        'Yo\'l Harakati Xavfsizlgi Boshqarmasi'
    ];
    
    // Create main worksheet
    const ws_data = [
        headers,
        ...sampleData
    ];
    
    // Add 95 more empty rows
    for (let i = 0; i < 95; i++) {
        ws_data.push(['', '', '', '', '', '', '']);
    }
    
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
    // Set column widths
    ws['!cols'] = [
        { wch: 30 }, // F.I.O
        { wch: 20 }, // Lavozimi
        { wch: 15 }, // Unvoni
        { wch: 20 }, // Bo'limi
        { wch: 15 }, // Telefon
        { wch: 15 }, // Xizmat Telefoni
        { wch: 25 }  // Tumani
    ];
    
    // Style header row (requires xlsx-style, but basic formatting still works)
    const headerRange = XLSX.utils.decode_range(ws['!ref']);
    for (let col = 0; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) continue;
        
        // Add cell format
        ws[cellAddress].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "4472C4" } },
            alignment: { horizontal: "center", vertical: "center" }
        };
    }
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Xodimlar');
    
    // Create instructions worksheet
    const instructions = [
        ['QO\'LLANMA'],
        [''],
        ['1. F.I.O va Telefon maydonlari majburiy'],
        ['2. Telefon raqamlarni 9 xonali kiriting: 991234567'],
        ['3. Birinchi qator namuna, uni o\'chirib o\'z ma\'lumotlaringizni kiriting'],
        ['4. Tuman nomlarini aniq yozing (quyidagi ro\'yxatdan)'],
        [''],
        ['TUMANLAR RO\'YXATI:'],
        ...districts.map(d => [d])
    ];
    
    const ws_instructions = XLSX.utils.aoa_to_sheet(instructions);
    ws_instructions['!cols'] = [{ wch: 40 }];
    
    XLSX.utils.book_append_sheet(wb, ws_instructions, 'Qo\'llanma');
    
    return wb;
}

async function saveExcelTemplate(outputPath) {
    const wb = await generateExcelTemplate();
    XLSX.writeFile(wb, outputPath);
    return outputPath;
}

module.exports = {
    generateExcelTemplate,
    saveExcelTemplate
};