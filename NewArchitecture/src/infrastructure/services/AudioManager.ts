/**
 * Audio Manager Implementation
 * Handles audio recording, playback and microphone management
 */

import { EventEmitter } from 'events';
import { injectable } from 'tsyringe';

export interface IAudioManager {
  initializeAudio(): Promise<MediaStream>;
  startRecording(stream: MediaStream): Promise<void>;
  stopRecording(): Promise<Blob>;
  playAudio(audioUrl: string): Promise<void>;
  stopAudio(): void;
  setVolume(level: number): void;
  getVolume(): number;
  getMicrophoneLevel(): number;
  isMicrophoneActive(): boolean;
  muteMicrophone(): void;
  unmuteMicrophone(): void;
  testMicrophone(): Promise<boolean>;
}

@injectable()
export class AudioManager extends EventEmitter implements IAudioManager {
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private currentAudioElement: HTMLAudioElement | null = null;
  private currentStream: MediaStream | null = null;
  private analyserNode: AnalyserNode | null = null;
  private microphoneGain: GainNode | null = null;
  private volume: number = 1.0;
  private isMuted: boolean = false;
  private isRecording: boolean = false;

  constructor() {
    super();
  }

  async initializeAudio(): Promise<MediaStream> {
    try {
      // Initialize AudioContext
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Request microphone access
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        },
        video: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.currentStream = stream;

      // Setup audio analysis
      this.setupAudioAnalysis(stream);

      this.emit('audioInitialized', { stream });
      return stream;

    } catch (error) {
      this.emit('audioInitializationFailed', { error });
      throw new Error(`Audio initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async startRecording(stream: MediaStream): Promise<void> {
    if (this.isRecording) {
      throw new Error('Recording already in progress');
    }

    try {
      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      };

      // Fallback for unsupported mime types
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/webm';
      }

      this.mediaRecorder = new MediaRecorder(stream, options);
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstart = () => {
        this.isRecording = true;
        this.emit('recordingStarted');
      };

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        this.emit('recordingStopped');
      };

      this.mediaRecorder.onerror = (error) => {
        this.isRecording = false;
        this.emit('recordingError', { error });
      };

      this.mediaRecorder.start(100); // Collect data every 100ms

    } catch (error) {
      throw new Error(`Recording start failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        this.recordedChunks = [];
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  async playAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Stop any currently playing audio
        this.stopAudio();

        this.currentAudioElement = new Audio(audioUrl);
        this.currentAudioElement.volume = this.volume;

        this.currentAudioElement.onloadeddata = () => {
          this.emit('audioLoaded', { url: audioUrl });
        };

        this.currentAudioElement.onplay = () => {
          this.emit('audioPlayStarted', { url: audioUrl });
        };

        this.currentAudioElement.onended = () => {
          this.emit('audioPlayEnded', { url: audioUrl });
          resolve();
        };

        this.currentAudioElement.onerror = (error) => {
          this.emit('audioPlayError', { url: audioUrl, error });
          reject(new Error(`Audio play failed: ${error}`));
        };

        this.currentAudioElement.onpause = () => {
          this.emit('audioPlayPaused', { url: audioUrl });
        };

        this.currentAudioElement.play().catch(reject);

      } catch (error) {
        reject(new Error(`Audio play setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  stopAudio(): void {
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement = null;
      this.emit('audioStopped');
    }
  }

  setVolume(level: number): void {
    this.volume = Math.max(0, Math.min(1, level));
    
    if (this.currentAudioElement) {
      this.currentAudioElement.volume = this.volume;
    }

    if (this.microphoneGain) {
      this.microphoneGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.audioContext!.currentTime);
    }

    this.emit('volumeChanged', { level: this.volume });
  }

  getVolume(): number {
    return this.volume;
  }

  getMicrophoneLevel(): number {
    if (!this.analyserNode) return 0;

    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    
    return sum / bufferLength / 255; // Normalize to 0-1
  }

  isMicrophoneActive(): boolean {
    return this.currentStream !== null && this.currentStream.getAudioTracks().some(track => track.enabled);
  }

  muteMicrophone(): void {
    this.isMuted = true;
    
    if (this.currentStream) {
      this.currentStream.getAudioTracks().forEach(track => {
        track.enabled = false;
      });
    }

    if (this.microphoneGain) {
      this.microphoneGain.gain.setValueAtTime(0, this.audioContext!.currentTime);
    }

    this.emit('microphoneMuted');
  }

  unmuteMicrophone(): void {
    this.isMuted = false;
    
    if (this.currentStream) {
      this.currentStream.getAudioTracks().forEach(track => {
        track.enabled = true;
      });
    }

    if (this.microphoneGain) {
      this.microphoneGain.gain.setValueAtTime(this.volume, this.audioContext!.currentTime);
    }

    this.emit('microphoneUnmuted');
  }

  async testMicrophone(): Promise<boolean> {
    try {
      if (!this.currentStream) {
        await this.initializeAudio();
      }

      // Test by checking if we can get microphone level
      return new Promise((resolve) => {
        let testCount = 0;
        const maxTests = 10;
        
        const testInterval = setInterval(() => {
          const level = this.getMicrophoneLevel();
          testCount++;
          
          if (level > 0.01 || testCount >= maxTests) {
            clearInterval(testInterval);
            const isWorking = level > 0.01;
            this.emit('microphoneTestResult', { isWorking, level });
            resolve(isWorking);
          }
        }, 100);
      });

    } catch (error) {
      this.emit('microphoneTestFailed', { error });
      return false;
    }
  }

  private setupAudioAnalysis(stream: MediaStream): void {
    if (!this.audioContext) return;

    try {
      // Create analyser for microphone level monitoring
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Create gain node for volume control
      this.microphoneGain = this.audioContext.createGain();
      this.microphoneGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);

      // Connect the audio graph
      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.microphoneGain);
      this.microphoneGain.connect(this.analyserNode);

      this.emit('audioAnalysisSetup');

    } catch (error) {
      this.emit('audioAnalysisSetupFailed', { error });
    }
  }

  // Cleanup method
  dispose(): void {
    this.stopAudio();
    
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }

    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
      this.currentStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyserNode = null;
    this.microphoneGain = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    
    this.emit('disposed');
  }
}