# Asterisk Audio Playback Setup

This guide explains how to configure FreePBX/Asterisk to play audio files during broadcast calls.

## Quick Setup

### 1. Copy Audio Files to Asterisk

```bash
# Create custom sounds directory if it doesn't exist
sudo mkdir -p /var/lib/asterisk/sounds/custom/xabarnoma

# Copy audio files from the web app
sudo cp /path/to/qashqadaryo-iib/public/audio/uploads/*.webm /var/lib/asterisk/sounds/custom/xabarnoma/

# Convert WebM to Asterisk-compatible format
cd /var/lib/asterisk/sounds/custom/xabarnoma/
for f in *.webm; do
  sudo ffmpeg -i "$f" -ar 8000 -ac 1 -acodec pcm_s16le "${f%.webm}.wav"
  sudo ffmpeg -i "$f" -ar 8000 -ac 1 -acodec pcm_mulaw "${f%.webm}.ulaw"
done

# Set proper permissions
sudo chown -R asterisk:asterisk /var/lib/asterisk/sounds/custom/xabarnoma/
```

### 2. Include Custom Dialplan

Edit `/etc/asterisk/extensions_custom.conf` and add:

```
#include /path/to/qashqadaryo-iib/asterisk/xabarnoma-dialplan.conf
```

Or copy the dialplan directly:

```bash
sudo cp /path/to/qashqadaryo-iib/asterisk/xabarnoma-dialplan.conf /etc/asterisk/
```

### 3. Configure SIP Context

In FreePBX, for each SIP extension (4529, etc.), set the context to allow custom contexts:

1. Go to Applications → Extensions
2. Edit extension 4529
3. Under "Advanced" tab, find "context"
4. Add: `from-internal,xabarnoma-broadcast`

### 4. Reload Asterisk

```bash
asterisk -rx "dialplan reload"
asterisk -rx "sip reload"
```

## Testing Audio Playback

### Test via CLI:

```bash
# Make a test call
asterisk -rx "channel originate SIP/4529 extension 999@xabarnoma-test"

# Watch console for debugging
asterisk -rvvv
```

### Test via the Application:

1. Upload an audio file through the web interface
2. Select "WebRTC orqali audio yuborish" option
3. Make a broadcast call
4. The audio should play automatically when the call is answered

## Troubleshooting

### No Audio Heard

1. **Check audio file format:**
   ```bash
   file /var/lib/asterisk/sounds/custom/xabarnoma/*.wav
   # Should show: RIFF (little-endian) data, WAVE audio, Microsoft PCM, 16 bit, mono 8000 Hz
   ```

2. **Check Asterisk can find the file:**
   ```bash
   asterisk -rx "core show sounds" | grep xabarnoma
   ```

3. **Enable SIP debugging:**
   ```bash
   asterisk -rx "sip set debug on"
   asterisk -rx "rtp set debug on"
   ```

4. **Check codec negotiation:**
   - Ensure both endpoints support PCMU (G.711 μ-law)
   - Check `sip show peer 4529` for allowed codecs

### Call Drops After 30 Seconds

This is usually due to NAT or session timer issues:

1. In FreePBX, edit the SIP extension:
   - Set "NAT" to "Yes - Force rport, comedia"
   - Set "Session Timers" to "Accept"
   - Set "Session Refresher" to "uas"

2. For the trunk (if using):
   - Set similar NAT settings
   - Increase "Registration Timeout" to 3600

## Using with Backend SIP

To make the backend SIP client use these dialplan contexts, modify the INVITE to include:

```javascript
// In sip-backend.js makeCall function
const inviteMessage = [
    `INVITE sip:${number}@${this.config.server} SIP/2.0`,
    // ... other headers ...
    `X-Xabarnoma-Context: xabarnoma-broadcast`,
    `X-Xabarnoma-AudioFile: custom/xabarnoma/${audioFile}`,
    // ... rest of message
];
```

Then configure Asterisk to route based on these headers.

## Alternative: Direct RTP Audio

If Asterisk dialplan doesn't work, the application can stream audio directly via RTP. See `AUDIO_PLAYBACK_SETUP.md` for details.

## Security Considerations

1. Limit access to custom contexts
2. Validate audio filenames to prevent directory traversal
3. Set maximum call duration limits
4. Monitor for abuse

## Performance Tuning

For high-volume broadcasts:

1. Pre-convert audio files to all needed formats
2. Use early media (183) to reduce answer supervision charges
3. Implement call queuing to avoid overwhelming the system
4. Use multiple SIP accounts to distribute load