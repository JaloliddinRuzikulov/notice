#!/bin/bash

# Download Russian voice for Piper TTS
echo "Downloading Russian voice for TTS..."

# Create directory
mkdir -p /tmp/piper-voices

# Download Russian female voice
cd /tmp/piper-voices
wget -q https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-ru-irina-medium.tar.gz
tar -xzf voice-ru-irina-medium.tar.gz

# Copy to container
docker cp ru_RU-irina-medium.onnx qashqadaryo-iib-notification:/tmp/
docker cp ru_RU-irina-medium.onnx.json qashqadaryo-iib-notification:/tmp/

echo "Russian voice installed successfully"