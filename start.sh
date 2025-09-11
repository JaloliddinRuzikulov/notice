#!/bin/bash

echo "=========================================="
echo "Qashqadaryo IIB Xabarnoma Tizimi"
echo "=========================================="

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Check if SSL certificates exist
if [ ! -f "config/cert.pem" ] || [ ! -f "config/key.pem" ]; then
    echo "SSL certificates not found. They will be generated automatically."
fi

# Start the server
echo "Starting server..."
npm start