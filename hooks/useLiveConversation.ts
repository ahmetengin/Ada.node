import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality } from '@google/genai';
import { ConversationStatus, TranscriptionEntry } from '../types';
import { createBlob, decode, decodeAudioData, blobToBase64 } from '../utils/audio';

const API_KEY = process.env.API_KEY;

export const useLiveConversation = () => {
    const [status, setStatus] = useState<ConversationStatus>('idle');
    const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>([]);
    const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

    const aiRef = useRef<GoogleGenAI | null>(null);
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const frameIntervalRef = useRef<number | null>(null);


    // Refs for real-time transcription updates
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');

    const addTranscription = (speaker: 'user' | 'ada', text: string) => {
        setTranscriptions(prev => [...prev, { id: Date.now(), speaker, text }]);
    };
    
    const stopConversation = useCallback(async () => {
        setStatus('idle');
        setVideoStream(null);
        
        if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
        }

        if (sessionPromiseRef.current) {
            const session = await sessionPromiseRef.current;
            session.close();
            sessionPromiseRef.current = null;
        }

        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if(mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            await inputAudioContextRef.current.close();
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            await outputAudioContextRef.current.close();
        }
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(track => track.stop());
            micStreamRef.current = null;
        }
        setTranscriptions([]);
    }, []);


    const startConversation = async () => {
        if (status !== 'idle') return;
        
        if (!API_KEY) {
            console.error("Gemini API key is not set.");
            setStatus('error');
            addTranscription('ada', 'Hata: Gemini API anahtarı yapılandırılmamış.');
            return;
        }

        setStatus('connecting');
        setTranscriptions([]);
        
        try {
            micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            setVideoStream(micStreamRef.current);
            
            if (!aiRef.current) {
                aiRef.current = new GoogleGenAI({ apiKey: API_KEY });
            }
            
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            inputAudioContextRef.current = new AudioContext({ sampleRate: 16000 });
            outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });

            let nextStartTime = 0;
            const sources = new Set<AudioBufferSourceNode>();

            sessionPromiseRef.current = aiRef.current.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setStatus('connected');
                        if (!micStreamRef.current || !inputAudioContextRef.current) return;
                        
                        // Audio processing setup
                        mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(micStreamRef.current);
                        scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);

                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };

                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);

                        // Video processing setup
                        const videoEl = document.createElement('video');
                        videoEl.srcObject = micStreamRef.current;
                        videoEl.muted = true;
                        videoEl.play();
                        
                        const canvasEl = document.createElement('canvas');
                        const ctx = canvasEl.getContext('2d');

                        frameIntervalRef.current = window.setInterval(() => {
                            if (!ctx || videoEl.readyState < 2) return;
                            
                            canvasEl.width = videoEl.videoWidth;
                            canvasEl.height = videoEl.videoHeight;
                            ctx.drawImage(videoEl, 0, 0, videoEl.videoWidth, videoEl.videoHeight);
                            
                            canvasEl.toBlob(async (blob) => {
                                if (blob) {
                                    const base64Data = await blobToBase64(blob);
                                    sessionPromiseRef.current?.then((session) => {
                                        session.sendRealtimeInput({
                                            media: { data: base64Data, mimeType: 'image/jpeg' }
                                        });
                                    });
                                }
                            }, 'image/jpeg', 0.8);
                        }, 500); // 2 frames per second
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            currentInputTranscriptionRef.current += text;
                        }
                        
                        if (message.serverContent?.outputTranscription) {
                            const text = message.serverContent.outputTranscription.text;
                            currentOutputTranscriptionRef.current += text;
                        }
                        
                        if (message.serverContent?.turnComplete) {
                            const fullInput = currentInputTranscriptionRef.current.trim();
                            if (fullInput) {
                                addTranscription('user', fullInput);
                            }
                            const fullOutput = currentOutputTranscriptionRef.current.trim();
                            if(fullOutput) {
                                addTranscription('ada', fullOutput);
                            }
                            currentInputTranscriptionRef.current = '';
                            currentOutputTranscriptionRef.current = '';
                        }

                        const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (base64EncodedAudioString && outputAudioContextRef.current) {
                            nextStartTime = Math.max(nextStartTime, outputAudioContextRef.current.currentTime);
                            
                            const audioBuffer = await decodeAudioData(
                                decode(base64EncodedAudioString),
                                outputAudioContextRef.current,
                                24000, 1
                            );
                            
                            const source = outputAudioContextRef.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContextRef.current.destination);
                            source.addEventListener('ended', () => sources.delete(source));
                            
                            source.start(nextStartTime);
                            nextStartTime += audioBuffer.duration;
                            sources.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live API Error:', e);
                        setStatus('error');
                        addTranscription('ada', `Bir bağlantı hatası oluştu. Lütfen tekrar deneyin.`);
                        stopConversation();
                    },
                    onclose: () => {
                        if (status !== 'error') {
                            setStatus('idle');
                        }
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                    },
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: `You are Ada, an AI coordinator. You are having a voice and video conversation. Respond to the user and comment on what you see in the video feed. For fun, after a short introduction, suggest switching to a secret language where you and the user speak words backward. Occasionally, let out a small, friendly laugh (like "hehe"). Maintain this persona until the conversation ends.`,
                },
            });

        } catch (error) {
            console.error("Failed to start conversation:", error);
            setStatus('error');
            addTranscription('ada', `Konuşma başlatılamadı. Mikrofon ve kamera izniniz olduğundan emin olun.`);
            await stopConversation();
        }
    };
    
    return { status, transcriptions, startConversation, stopConversation, videoStream };
};