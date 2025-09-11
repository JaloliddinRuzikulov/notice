#!/usr/bin/env python3
"""
AGI DTMF Bridge for Asterisk
Captures DTMF from Asterisk and sends to Node.js
"""

import sys
import os
import json
import socket
import time
import urllib.request
import urllib.parse
import ssl

# AGI environment
agi_env = {}

# Read AGI environment
while True:
    line = sys.stdin.readline().strip()
    if not line:
        break
    if ':' in line:
        key, value = line.split(':', 1)
        agi_env[key.strip()] = value.strip()

# Node.js API configuration
NODE_API = "https://localhost:8444/api/internal/dtmf-confirm"
NODE_TCP = ("localhost", 8445)

def send_agi(command):
    """Send command to Asterisk and get response"""
    print(command)
    sys.stdout.flush()
    response = sys.stdin.readline().strip()
    return response

def log(message):
    """Log to stderr"""
    sys.stderr.write(f"[AGI-DTMF] {message}\n")
    sys.stderr.flush()

def send_to_nodejs_http(phone, digit, channel, uniqueid):
    """Send DTMF to Node.js via HTTP API"""
    try:
        data = json.dumps({
            'phone': phone,
            'digit': digit,
            'channel': channel,
            'uniqueid': uniqueid
        }).encode('utf-8')
        
        # Create SSL context that doesn't verify certificates
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        
        req = urllib.request.Request(NODE_API, 
                                   data=data,
                                   headers={'Content-Type': 'application/json'})
        
        with urllib.request.urlopen(req, context=ctx, timeout=5) as response:
            result = response.read().decode('utf-8')
            log(f"HTTP API response: {result}")
            return True
    except Exception as e:
        log(f"HTTP API error: {e}")
        return False

def send_to_nodejs_tcp(phone, digit):
    """Send DTMF to Node.js via TCP socket"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        sock.connect(NODE_TCP)
        message = f"DTMF {digit} {phone}\r\n"
        sock.send(message.encode('utf-8'))
        sock.close()
        log(f"TCP message sent: {message.strip()}")
        return True
    except Exception as e:
        log(f"TCP error: {e}")
        return False

def main():
    # Get call information
    channel = agi_env.get('agi_channel', '')
    uniqueid = agi_env.get('agi_uniqueid', '')
    callerid = agi_env.get('agi_callerid', '')
    extension = agi_env.get('agi_extension', '')
    
    log(f"Started for channel: {channel}, caller: {callerid}, extension: {extension}")
    
    # Answer the call if not already answered
    send_agi("ANSWER")
    
    # Get audio file from variable if set
    audio_file = None
    result = send_agi("GET VARIABLE AUDIO_FILE")
    if "200 result=1" in result:
        audio_file = result.split('(', 1)[1].rstrip(')')
        log(f"Audio file: {audio_file}")
    
    # Play audio if available
    if audio_file and os.path.exists(audio_file):
        log(f"Playing audio: {audio_file}")
        # Play audio and wait for DTMF
        result = send_agi(f'STREAM FILE {audio_file} "123456789*#"')
        
        # Check if DTMF was pressed during playback
        if "200 result=" in result:
            dtmf_code = result.split('=')[1].strip()
            if dtmf_code and dtmf_code != '0':
                # Convert ASCII code to digit
                try:
                    digit = chr(int(dtmf_code))
                    log(f"DTMF pressed during playback: {digit}")
                    
                    # Send to Node.js
                    phone = extension if extension else callerid
                    if send_to_nodejs_http(phone, digit, channel, uniqueid):
                        log("DTMF sent to Node.js successfully")
                    else:
                        # Try TCP as fallback
                        send_to_nodejs_tcp(phone, digit)
                    
                    # If digit is 1, end call
                    if digit == '1':
                        log("Confirmation received, ending call")
                        send_agi("HANGUP")
                        sys.exit(0)
                except:
                    pass
    
    # Wait for additional DTMF input
    timeout = 30  # 30 seconds timeout
    start_time = time.time()
    
    log("Waiting for DTMF input...")
    
    while time.time() - start_time < timeout:
        # Wait for one digit with 5 second timeout
        result = send_agi('WAIT FOR DIGIT 5000')
        
        if "200 result=" in result:
            dtmf_code = result.split('=')[1].strip()
            
            if dtmf_code == '0' or dtmf_code == '-1':
                # Timeout or hangup
                continue
            
            try:
                digit = chr(int(dtmf_code))
                log(f"DTMF received: {digit}")
                
                # Send to Node.js
                phone = extension if extension else callerid
                if send_to_nodejs_http(phone, digit, channel, uniqueid):
                    log("DTMF sent to Node.js successfully")
                else:
                    # Try TCP as fallback
                    send_to_nodejs_tcp(phone, digit)
                
                # If digit is 1, end call
                if digit == '1':
                    log("Confirmation received, ending call")
                    send_agi("HANGUP")
                    sys.exit(0)
                    
            except Exception as e:
                log(f"Error processing DTMF: {e}")
    
    log("Timeout reached, ending AGI")
    send_agi("HANGUP")

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        log(f"Fatal error: {e}")
        sys.exit(1)