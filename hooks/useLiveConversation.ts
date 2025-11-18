
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ConversationStatus, TranscriptionEntry } from '../types';
import { createBlob, decode, decodeAudioData, blobToBase64 } from '../utils/audio';

// TFJS and segmentation model are loaded via script tags, so we declare them here.
declare const bodySegmentation: any;

const API_KEY = process.env.API_KEY;

export type BackgroundEffect = 'none' | 'blur' | 'vbg1' | 'vbg2' | 'custom';

// Base64 encoded virtual backgrounds
const VBG1_URL = 'data:image/jpeg;base64,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';
const VBG2_URL = 'data:image/jpeg;base64,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';

let ai: GoogleGenAI | null = null;
const getAiClient = (): GoogleGenAI => {
    if (!ai) {
        if (!API_KEY) {
            console.error("Gemini API key not set.");
            // Allow constructor to handle the error more gracefully
        }
        ai = new GoogleGenAI({ apiKey: API_KEY! });
    }
    return ai;
};


export const useLiveConversation = () => {
    const [status, setStatus] = useState<ConversationStatus>('idle');
    const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>([]);
    
    // Virtual background state
    const [backgroundEffect, setBackgroundEffect] = useState<BackgroundEffect>('none');
    const [customBgUrl, setCustomBgUrl] = useState<string | null>(null);
    const [isSegmenterLoading, setIsSegmenterLoading] = useState(false);
    
    // Renamed videoStream to processedStream to be more descriptive
    const [processedStream, setProcessedStream] = useState<MediaStream | null>(null);

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    
    const statusRef = useRef(status);
    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    // Refs for video processing
    const segmenterRef = useRef<any>(null);
    const rawVideoRef = useRef<HTMLVideoElement>(document.createElement('video'));
    const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
    const animationFrameIdRef = useRef<number | null>(null);
    const bgImageRef = useRef<HTMLImageElement>(new Image());

    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');

    const addTranscription = (speaker: 'user' | 'ada', text: string) => {
        setTranscriptions(prev => [...prev, { id: Date.now(), speaker, text }]);
    };
    
    const stopProcessingLoop = () => {
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }
    };

    const stopConversation = useCallback(async () => {
        setStatus('idle');
        setProcessedStream(null);
        stopProcessingLoop();

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

    const startProcessingLoop = useCallback(async () => {
        const video = rawVideoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const segmenter = segmenterRef.current;

        if (!ctx || !segmenter || video.readyState < 2) {
            animationFrameIdRef.current = requestAnimationFrame(startProcessingLoop);
            return;
        }
        
        const people = await segmenter.segmentPeople(video);
        
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        switch (backgroundEffect) {
            case 'blur':
                ctx.filter = 'blur(8px)';
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                ctx.filter = 'none';
                break;
            case 'vbg1':
            case 'vbg2':
            case 'custom':
                 if(bgImageRef.current.src && bgImageRef.current.complete) {
                    ctx.drawImage(bgImageRef.current, 0, 0, canvas.width, canvas.height);
                 }
                break;
            default: // 'none'
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                break;
        }

        if (backgroundEffect !== 'none' && people.length > 0) {
            const foreground = await bodySegmentation.toBinaryMask(people, {r: 0, g: 0, b: 0, a: 0}, {r: 0, g: 0, b: 0, a: 255});
            ctx.globalCompositeOperation = 'destination-in';
            ctx.drawImage(foreground, 0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
        
        ctx.restore();

        animationFrameIdRef.current = requestAnimationFrame(startProcessingLoop);
    }, [backgroundEffect]);

    useEffect(() => {
        let url = '';
        if (backgroundEffect === 'vbg1') url = VBG1_URL;
        else if (backgroundEffect === 'vbg2') url = VBG2_URL;
        else if (backgroundEffect === 'custom' && customBgUrl) url = customBgUrl;
        
        if(url) {
            bgImageRef.current.crossOrigin = "anonymous";
            bgImageRef.current.src = url;
        }
    }, [backgroundEffect, customBgUrl]);


    const startConversation = async () => {
        if (status !== 'idle') return;
        
        if (!API_KEY) {
            setStatus('error');
            addTranscription('ada', 'Hata: Gemini API anahtarı yapılandırılmamış.');
            return;
        }

        setStatus('connecting');
        setTranscriptions([]);
        
        try {
            if (backgroundEffect !== 'none' && !segmenterRef.current) {
                setIsSegmenterLoading(true);
                const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
                const segmenterConfig = {
                    runtime: 'mediapipe',
                    solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation`,
                    modelType: 'general'
                };
                segmenterRef.current = await bodySegmentation.createSegmenter(model, segmenterConfig);
                setIsSegmenterLoading(false);
            }
            
            micStreamRef.current = await navigator.mediaDevices.getUserMedia({ 
                audio: true, 
                video: { width: 640, height: 360, frameRate: 30 } 
            });

            const video = rawVideoRef.current;
            video.srcObject = micStreamRef.current;
            video.muted = true;
            await video.play();

            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Capture stream from canvas and add audio track
            const canvasStream = canvas.captureStream(30);
            const audioTrack = micStreamRef.current.getAudioTracks()[0];
            canvasStream.addTrack(audioTrack);
            setProcessedStream(canvasStream);

            startProcessingLoop();
            
            const aiClient = getAiClient();
            
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            inputAudioContextRef.current = new AudioContext({ sampleRate: 16000 });
            outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });

            let nextStartTime = 0;
            const sources = new Set<AudioBufferSourceNode>();

            sessionPromiseRef.current = aiClient.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setStatus('connected');
                        if (!micStreamRef.current || !inputAudioContextRef.current) return;
                        
                        mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(micStreamRef.current);
                        scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);

                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: createBlob(inputData) });
                            });
                        };

                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                        
                        // Send video frames from the processed canvas
                        const frameInterval = setInterval(() => {
                           canvasRef.current.toBlob(async (blob) => {
                                if (blob && (statusRef.current === 'connected' || statusRef.current === 'connecting')) {
                                    const base64Data = await blobToBase64(blob);
                                    sessionPromiseRef.current?.then((session) => {
                                        session.sendRealtimeInput({
                                            media: { data: base64Data, mimeType: 'image/jpeg' }
                                        });
                                    });
                                } else {
                                     clearInterval(frameInterval);
                                }
                            }, 'image/jpeg', 0.8);
                        }, 500);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                        }
                        if (message.serverContent?.turnComplete) {
                            const fullInput = currentInputTranscriptionRef.current.trim();
                            if (fullInput) addTranscription('user', fullInput);
                            const fullOutput = currentOutputTranscriptionRef.current.trim();
                            if(fullOutput) addTranscription('ada', fullOutput);
                            currentInputTranscriptionRef.current = '';
                            currentOutputTranscriptionRef.current = '';
                        }
                        
                        const audioPart = message.serverContent?.modelTurn?.parts?.find(p => p.inlineData);
                        const base64Audio = audioPart?.inlineData?.data;

                        if (base64Audio && outputAudioContextRef.current) {
                            nextStartTime = Math.max(nextStartTime, outputAudioContextRef.current.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
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
                        if (statusRef.current !== 'error') setStatus('idle');
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: `You are Ada, an AI coordinator. Start the conversation immediately with a friendly greeting and by introducing yourself. You are having a voice and video conversation. Respond to the user and comment on what you see in the video feed. For fun, after a short introduction, suggest switching to a secret language where you and the user speak words backward. Maintain this persona until the conversation ends.`,
                },
            });
        } catch (error) {
            console.error("Failed to start conversation:", error);
            setStatus('error');
            addTranscription('ada', `Konuşma başlatılamadı. İzinlerinizi kontrol edin.`);
            setIsSegmenterLoading(false);
            await stopConversation();
        }
    };
    
    return { status, transcriptions, startConversation, stopConversation, videoStream: processedStream, backgroundEffect, setBackgroundEffect, setCustomBgUrl, isSegmenterLoading };
};