/**
 * AI Chat Screen with Voice Recognition
 * Supports both text input and voice commands
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot, User, RefreshCw, Plus, Sparkles, Zap, MessageSquare, Copy, Check, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { chatService, ChatMessage } from '@/services/ChatService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const QUICK_PROMPTS = [
    { icon: '📊', text: 'Analyze team workload', prompt: 'Can you analyze the current team workload and suggest optimizations?' },
    { icon: '🎯', text: 'Project risks', prompt: 'What are the potential risks in our active projects?' },
    { icon: '👥', text: 'Resource allocation', prompt: 'Suggest optimal resource allocation for upcoming sprint' },
    { icon: '📈', text: 'Performance insights', prompt: 'Provide insights on team performance metrics' },
];

// Voice Recognition Hook
function useVoiceRecognition() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Check for browser support
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (SpeechRecognition) {
            setIsSupported(true);
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                setTranscript(finalTranscript || interimTranscript);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            setTranscript('');
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return {
        isListening,
        transcript,
        isSupported,
        startListening,
        stopListening,
        toggleListening,
        clearTranscript: () => setTranscript('')
    };
}

// Text-to-Speech Hook
function useTextToSpeech() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        setIsSupported('speechSynthesis' in window);
    }, []);

    const speak = (text: string) => {
        if (!isSupported) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    const stop = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    };

    return { isSpeaking, isSupported, speak, stop };
}

export default function ChatScreenWithVoice() {
    const [messages, setMessages] = useState<ChatMessage[]>(chatService.getHistory());
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [autoSpeak, setAutoSpeak] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const voice = useVoiceRecognition();
    const tts = useTextToSpeech();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Update input when voice transcript changes
    useEffect(() => {
        if (voice.transcript) {
            setInput(voice.transcript);
        }
    }, [voice.transcript]);

    // Auto-send when voice recognition ends with text
    useEffect(() => {
        if (!voice.isListening && voice.transcript.trim()) {
            // Small delay to allow final transcript
            const timer = setTimeout(() => {
                handleSend(voice.transcript);
                voice.clearTranscript();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [voice.isListening]);

    const handleNewChat = () => {
        if (confirm('Start a new chat? This will clear the current conversation.')) {
            chatService.clearHistory();
            setMessages([]);
            setInput('');
        }
    };

    const handleRefresh = () => {
        setMessages([...chatService.getHistory()]);
    };

    const handleCopy = async (text: string, index: number) => {
        await navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleSend = async (messageText?: string) => {
        const userText = (messageText || input).trim();
        if (!userText || isLoading) return;

        setInput('');
        voice.clearTranscript();
        setIsLoading(true);

        setMessages(prev => [...prev, { role: 'user', text: userText }]);

        try {
            await chatService.sendMessage(userText);
            const history = chatService.getHistory();
            setMessages(history);

            // Auto-speak the response if enabled
            if (autoSpeak && history.length > 0) {
                const lastMessage = history[history.length - 1];
                if (lastMessage.role === 'model') {
                    tts.speak(lastMessage.text);
                }
            }
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.message || 'Sorry, something went wrong. Please check your API key or try again.';
            setMessages(prev => [...prev, { role: 'model', text: `Error: ${errorMessage}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 font-sans overflow-hidden">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                            <Bot size={24} className="text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                            <Zap size={10} className="text-white" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            AllocX Assistant
                            <Badge className="bg-indigo-100 text-indigo-700 border-0 font-medium text-xs">AI</Badge>
                            {voice.isSupported && (
                                <Badge className="bg-emerald-100 text-emerald-700 border-0 font-medium text-xs">
                                    <Mic className="w-3 h-3 mr-1" />
                                    Voice
                                </Badge>
                            )}
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-200" />
                                Online
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs text-slate-400">Powered by Ollama (Phi-3)</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Auto-speak toggle */}
                    {tts.isSupported && (
                        <Button
                            onClick={() => setAutoSpeak(!autoSpeak)}
                            variant="ghost"
                            size="sm"
                            className={`h-9 w-9 p-0 rounded-xl ${autoSpeak ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100'}`}
                            title={autoSpeak ? 'Disable auto-speak' : 'Enable auto-speak'}
                        >
                            {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                        </Button>
                    )}
                    <Button
                        onClick={handleRefresh}
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-xl hover:bg-slate-100"
                        title="Refresh chat"
                    >
                        <RefreshCw className="w-4 h-4 text-slate-500" />
                    </Button>
                    <Button
                        onClick={handleNewChat}
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-xl border-slate-200 hover:bg-slate-50"
                        title="New chat"
                    >
                        <Plus className="w-4 h-4 mr-1.5" />
                        New Chat
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-200/50">
                            <Sparkles size={36} className="text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">How can I help you today?</h3>
                        <p className="text-slate-500 text-center mb-4 max-w-md">
                            I'm your AI assistant for resource allocation. Ask me about team optimization, project insights, or workload balancing.
                        </p>
                        
                        {/* Voice Indicator */}
                        {voice.isSupported && (
                            <div className="flex items-center gap-2 mb-6 text-sm text-slate-500">
                                <Mic className="w-4 h-4" />
                                <span>Click the microphone or press and hold to speak</span>
                            </div>
                        )}
                        
                        {/* Quick Prompts */}
                        <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                            {QUICK_PROMPTS.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(item.prompt)}
                                    className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all text-left group"
                                >
                                    <span className="text-2xl">{item.icon}</span>
                                    <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">{item.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 max-w-3xl mx-auto">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                            >
                                <div className={`flex max-w-[85%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Avatar */}
                                    <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${
                                        msg.role === 'user' 
                                            ? 'bg-gradient-to-br from-slate-700 to-slate-900 text-white' 
                                            : 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white'
                                    }`}>
                                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                    </div>

                                    {/* Bubble */}
                                    <div className="group relative">
                                        <div
                                            className={`p-4 text-[15px] leading-relaxed break-words ${
                                                msg.role === 'user'
                                                    ? 'bg-slate-900 text-white rounded-2xl rounded-tr-md shadow-lg'
                                                    : 'bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-tl-md shadow-sm'
                                            }`}
                                        >
                                            {msg.text}
                                        </div>
                                        {msg.role === 'model' && (
                                            <div className="absolute -bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {tts.isSupported && (
                                                    <button 
                                                        onClick={() => tts.isSpeaking ? tts.stop() : tts.speak(msg.text)}
                                                        className="bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm hover:bg-slate-50"
                                                    >
                                                        {tts.isSpeaking ? (
                                                            <VolumeX size={14} className="text-slate-400" />
                                                        ) : (
                                                            <Volume2 size={14} className="text-slate-400" />
                                                        )}
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleCopy(msg.text, index)}
                                                    className="bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm hover:bg-slate-50"
                                                >
                                                    {copiedIndex === index ? (
                                                        <Check size={14} className="text-emerald-500" />
                                                    ) : (
                                                        <Copy size={14} className="text-slate-400" />
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start w-full animate-in fade-in zoom-in-95 duration-300">
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-sm">
                                        <Bot size={16} />
                                    </div>
                                    <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-md shadow-sm flex items-center gap-2">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                                        </div>
                                        <span className="text-sm text-slate-400 ml-2">Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white/80 backdrop-blur-xl border-t border-slate-200/60 p-4">
                <div className="max-w-3xl mx-auto">
                    {/* Voice Recording Indicator */}
                    {voice.isListening && (
                        <div className="mb-3 flex items-center justify-center gap-3 py-3 bg-red-50 border border-red-200 rounded-xl animate-pulse">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-sm font-medium text-red-600">Listening...</span>
                            <span className="text-sm text-red-500">{voice.transcript || 'Speak now'}</span>
                        </div>
                    )}

                    <div className="relative flex items-end bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-100/50 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={voice.isListening ? 'Listening...' : 'Ask me anything about resource allocation...'}
                            className="w-full pl-5 pr-28 py-4 bg-transparent border-0 focus:ring-0 resize-none text-[15px] max-h-32 text-slate-900 placeholder:text-slate-400 leading-relaxed rounded-2xl"
                            rows={1}
                            style={{ minHeight: '56px' }}
                            disabled={voice.isListening}
                        />
                        
                        <div className="absolute right-3 bottom-3 flex items-center gap-2">
                            {/* Voice Button */}
                            {voice.isSupported && (
                                <button
                                    onClick={voice.toggleListening}
                                    className={`p-2.5 rounded-xl transition-all ${
                                        voice.isListening 
                                            ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                    title={voice.isListening ? 'Stop listening' : 'Start voice input'}
                                >
                                    {voice.isListening ? <MicOff size={18} /> : <Mic size={18} />}
                                </button>
                            )}

                            {/* Send Button */}
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading || voice.isListening}
                                className="p-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200/50 hover:shadow-indigo-300/50 active:scale-95"
                            >
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            </button>
                        </div>
                    </div>
                    <p className="text-center mt-3 text-xs text-slate-400">
                        Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-mono text-[10px]">Enter</kbd> to send • 
                        {voice.isSupported && (
                            <> Click <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-mono text-[10px]">🎤</kbd> for voice • </>
                        )}
                        <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-mono text-[10px]">Shift + Enter</kbd> for new line
                    </p>
                </div>
            </div>
        </div>
    );
}
