#!/bin/bash

# Install gTTS in Docker container
docker exec qashqadaryo-iib-notification sh -c "
    # Install pip if not available
    python3 -m ensurepip --upgrade || true
    
    # Install gTTS
    pip3 install gtts
    
    # Test installation
    python3 -c 'import gtts; print(\"gTTS installed successfully\")'
"