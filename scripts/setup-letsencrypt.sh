#!/bin/bash

# Let's Encrypt SSL Certificate Setup Script
# For Qashqadaryo IIB Notification System

set -e

# Configuration
DOMAIN="xabarnoma.qashqadaryo-iib.uz"
EMAIL="admin@qashqadaryo-iib.uz"
WEBROOT="/mnt/hdd128gb/qashqadaryo-iib-notification/public"
CONFIG_DIR="/mnt/hdd128gb/qashqadaryo-iib-notification/config"

echo "=== Let's Encrypt SSL Certificate Setup ==="
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Install certbot if not installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    apt-get update
    apt-get install -y certbot
fi

# Create webroot directory if not exists
mkdir -p "$WEBROOT/.well-known/acme-challenge"

# Create temporary HTTP server for validation
echo "Creating temporary HTTP server for domain validation..."
cat > /tmp/temp-http-server.js << 'EOF'
const express = require('express');
const path = require('path');
const app = express();

// Serve ACME challenge files
app.use('/.well-known/acme-challenge', express.static(path.join(process.argv[2], '.well-known/acme-challenge')));

// Health check
app.get('/health', (req, res) => {
    res.send('OK');
});

app.listen(80, () => {
    console.log('Temporary HTTP server running on port 80 for ACME challenge');
});
EOF

# Start temporary server
node /tmp/temp-http-server.js "$WEBROOT" &
TEMP_SERVER_PID=$!

# Wait for server to start
sleep 3

# Request certificate
echo "Requesting SSL certificate from Let's Encrypt..."
certbot certonly \
    --webroot \
    --webroot-path "$WEBROOT" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --domains "$DOMAIN" \
    --non-interactive

# Stop temporary server
kill $TEMP_SERVER_PID

# Copy certificates to config directory
echo "Copying certificates to application config..."
cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$CONFIG_DIR/cert.pem"
cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$CONFIG_DIR/key.pem"

# Set proper permissions
chmod 600 "$CONFIG_DIR/key.pem"
chmod 644 "$CONFIG_DIR/cert.pem"
chown $(stat -c "%U:%G" "$CONFIG_DIR/..") "$CONFIG_DIR/cert.pem" "$CONFIG_DIR/key.pem"

# Create renewal script
echo "Creating renewal script..."
cat > "$CONFIG_DIR/renew-ssl.sh" << EOF
#!/bin/bash
certbot renew --webroot --webroot-path "$WEBROOT" --quiet
if [ \$? -eq 0 ]; then
    cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$CONFIG_DIR/cert.pem"
    cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$CONFIG_DIR/key.pem"
    chmod 600 "$CONFIG_DIR/key.pem"
    chmod 644 "$CONFIG_DIR/cert.pem"
    
    # Restart application
    systemctl restart qashqadaryo-notification || pm2 restart qashqadaryo-notification || echo "Please restart application manually"
fi
EOF

chmod +x "$CONFIG_DIR/renew-ssl.sh"

# Add cron job for automatic renewal
echo "Setting up automatic renewal..."
(crontab -l 2>/dev/null; echo "0 2 * * * $CONFIG_DIR/renew-ssl.sh") | crontab -

echo ""
echo "=== SSL Certificate Setup Complete ==="
echo ""
echo "Certificate files:"
echo "  - Certificate: $CONFIG_DIR/cert.pem"
echo "  - Private Key: $CONFIG_DIR/key.pem"
echo ""
echo "Automatic renewal has been configured via cron."
echo "Renewal script: $CONFIG_DIR/renew-ssl.sh"
echo ""
echo "Please restart your application to use the new certificates."
echo ""

# Clean up
rm -f /tmp/temp-http-server.js