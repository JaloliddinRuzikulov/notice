async function downloadExcelTemplate() {
    try {
        // Download XLSX template directly
        const link = document.createElement('a');
        link.href = '/templates/xodimlar-shablon.xlsx';
        link.download = 'xodimlar_import_shablon.xlsx';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
    } catch (error) {
        console.error('Template download error:', error);
        alert('Shablon yuklab olishda xatolik: ' + error.message);
    }
}

// Global qilish
window.downloadExcelTemplate = downloadExcelTemplate;