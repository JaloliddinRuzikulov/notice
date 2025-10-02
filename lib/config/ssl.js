const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

/**
 * Get SSL certificate paths
 * @returns {{certPath: string, keyPath: string}} SSL certificate paths
 */
function getSSLPaths() {
    return {
        certPath: path.join(__dirname, '../../config/cert.pem'),
        keyPath: path.join(__dirname, '../../config/key.pem')
    };
}

/**
 * Generate self-signed SSL certificate if not exists
 */
function ensureSSLCertificate() {
    const { certPath, keyPath } = getSSLPaths();

    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        return; // Certificates already exist
    }

    console.log('Generating self-signed certificate...');

    // Create config directory if not exists
    const configDir = path.join(__dirname, '../../config');
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    // Generate certificate using OpenSSL
    try {
        execFileSync('openssl', [
            'req', '-x509', '-newkey', 'rsa:4096',
            '-keyout', keyPath,
            '-out', certPath,
            '-days', '365', '-nodes',
            '-subj', '/C=UZ/ST=Qashqadaryo/L=Qarshi/O=IIB/CN=localhost'
        ]);
        console.log('✅ SSL certificate generated successfully');
    } catch (error) {
        console.error('❌ Error generating SSL certificate:', error.message);
        throw error;
    }
}

/**
 * Get HTTPS options with SSL certificates
 * @returns {{key: Buffer, cert: Buffer}} HTTPS options
 */
function getHTTPSOptions() {
    ensureSSLCertificate();
    const { certPath, keyPath } = getSSLPaths();

    return {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
    };
}

module.exports = { getHTTPSOptions, ensureSSLCertificate };
