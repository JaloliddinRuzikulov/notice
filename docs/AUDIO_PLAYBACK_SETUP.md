# Audio Playback Configuration for SIP Broadcast

This document explains how to configure audio playback for the Xabarnoma notification system.

## Overview

The system now supports two methods for playing audio during SIP calls:

1. **Direct RTP Streaming** - The SIP backend converts and streams audio files directly via RTP
2. **Asterisk Dialplan** - Uses Asterisk's built-in Playback() application

## Method 1: Direct RTP Streaming (Default)

The SIP backend automatically converts audio files (webm, mp3, wav) to telephony format and streams them via RTP.

### How it works:
1. Audio file is converted to 8kHz PCM using FFmpeg
2. PCM is encoded to G.711 μ-law (PCMU) 
3. Audio is packetized into RTP packets
4. Packets are sent every 20ms to the remote endpoint

### Requirements:
- FFmpeg must be installed: `sudo apt-get install ffmpeg`
- Audio files must be in `/public/audio/uploads/`

### Usage:
```javascript
// When making a call via SIP backend
const result = await sip.makeCall(phoneNumber, {
    audioFile: 'bc2debbb-b775-4bf6-983c-e6a1f7fa3b02.webm'
});
```

## Method 2: Asterisk Dialplan

For Asterisk/FreePBX integration, use the custom dialplan contexts.

### Setup:

1. **Copy audio files to Asterisk sounds directory:**
   ```bash
   sudo cp /path/to/qashqadaryo-iib/public/audio/uploads/*.webm /var/lib/asterisk/sounds/custom/
   ```

2. **Convert files to Asterisk-compatible format:**
   ```bash
   cd /var/lib/asterisk/sounds/custom/
   for f in *.webm; do
     ffmpeg -i "$f" -ar 8000 -ac 1 "${f%.webm}.wav"
   done
   ```

3. **Include custom dialplan in Asterisk:**
   
   Edit `/etc/asterisk/extensions_custom.conf` and add:
   ```
   #include /path/to/qashqadaryo-iib/asterisk/xabarnoma-dialplan.conf
   ```

4. **Reload Asterisk dialplan:**
   ```bash
   asterisk -rx "dialplan reload"
   ```

### Available Contexts:

- `xabarnoma-broadcast` - Basic audio playback with repeat
- `xabarnoma-broadcast-dtmf` - Audio playback with DTMF confirmation
- `xabarnoma-early-media` - Early media playback (before answer)

## Troubleshooting

### No Audio Heard

1. **Check RTP connectivity:**
   - Ensure firewall allows UDP ports 10000-20000
   - Check NAT settings in SIP configuration

2. **Verify audio file format:**
   ```bash
   ffmpeg -i audiofile.webm
   ```

3. **Monitor RTP traffic:**
   ```bash
   tcpdump -i any -n port 10000
   ```

4. **Check Asterisk logs:**
   ```bash
   asterisk -rvvv
   ```

### Audio Quality Issues

1. **Ensure proper codec:**
   - System uses G.711 μ-law (PCMU) by default
   - Verify remote endpoint supports PCMU

2. **Check network conditions:**
   - Packet loss can cause audio dropouts
   - Jitter can cause choppy audio

## Testing

Test audio streaming:
```bash
# Test direct RTP streaming
curl -X POST http://localhost:3000/api/broadcast/create \
  -F "audio=@test.webm" \
  -F "employeeIds=[\"emp1\"]" \
  -F "sipAccounts=[]"
```

## Configuration

Environment variables:
```env
# For direct SIP backend
SIP_SERVER=10.102.0.3
SIP_EXTENSION_1=4529
SIP_PASSWORD=4529

# For Asterisk AMI
AMI_HOST=10.102.0.3
AMI_PORT=5038
AMI_USERNAME=admin
AMI_PASSWORD=mysecret
```

## Audio File Requirements

- **Format:** webm, mp3, wav, ogg
- **Max size:** 10MB
- **Recommended:** 
  - Sample rate: 8kHz
  - Channels: Mono
  - Codec: Opus, MP3, or PCM

## Security Considerations

1. Audio files are stored in public directory - consider access control
2. FFmpeg runs with subprocess - ensure proper input validation
3. RTP traffic is unencrypted - use VPN or private network

## Performance

- Audio conversion is cached in memory
- Each RTP stream uses ~64kbps bandwidth
- System can handle multiple concurrent calls

## Future Enhancements

1. Support for SRTP (encrypted RTP)
2. Dynamic codec negotiation
3. Text-to-speech integration
4. Call recording capability