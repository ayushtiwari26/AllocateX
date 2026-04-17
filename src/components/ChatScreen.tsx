
import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot, User, RefreshCw, Plus, Sparkles, Zap, MessageSquare, Copy, Check, Mic, MicOff, Volume2, VolumeX, StopCircle } from 'lucide-react';
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

            recognitionRef.current.onend = () => setIsListening(false);
            recognitionRef.current.onerror = () => setIsListening(false);
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            setTranscript('');
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    return { isListening, transcript, isSupported, toggleListening, clearTranscript: () => setTranscript('') };
}

// Text-to-Speech Hook
function useTextToSpeech() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        setIsSupported('speechSynthesis' in window);
        
        // Cleanup on unmount
        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const speak = (text: string) => {
        if (!isSupported) return;
        
        // Cancel any ongoing speech first
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        window.speechSynthesis.speak(utterance);
    };

    const stop = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
    };

    const toggle = (text: string) => {
        if (isSpeaking) {
            stop();
        } else {
            speak(text);
        }
    };

    return { isSpeaking, isSupported, speak, stop, toggle };
}

export default function ChatScreen() {
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

    // Auto-send when voice stops with text
    useEffect(() => {
        if (!voice.isListening && voice.transcript.trim()) {
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
        setIsLoading(true);

        // Get current history and add user message for immediate display
        const currentHistory = chatService.getHistory();
        setMessages([...currentHistory, { role: 'user', text: userText }]);

        try {
            await chatService.sendMessage(userText);
            const history = chatService.getHistory();
            setMessages(history);
            
            // Auto-speak response if enabled
            if (autoSpeak && history.length > 0) {
                const lastMsg = history[history.length - 1];
                if (lastMsg.role === 'model') {
                    tts.speak(lastMsg.text);
                }
            }
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.message || 'Sorry, something went wrong. Please check your API key or try again.';
            // Add error to history display without duplicating
            const history = chatService.getHistory();
            setMessages([...history, { role: 'model', text: `Error: ${errorMessage}` }]);
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
            <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="relative">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                            <Bot size={20} className="sm:hidden text-white" />
                            <Bot size={24} className="hidden sm:block text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                            <Zap size={8} className="sm:hidden text-white" />
                            <Zap size={10} className="hidden sm:block text-white" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1 sm:gap-2">
                            <span className="hidden xs:inline">AllocX</span> Assistant
                            <Badge className="bg-indigo-100 text-indigo-700 border-0 font-medium text-[10px] sm:text-xs hidden sm:inline-flex">AI</Badge>
                        </h2>
                        <div className="flex items-center gap-1 sm:gap-2">
                            <span className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500">
                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-200" />
                                Online
                            </span>
                            <span className="text-slate-300 hidden sm:inline">•</span>
                            <span className="text-[10px] sm:text-xs text-slate-400 hidden sm:inline">Powered by Ollama</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                    {/* Auto-speak toggle */}
                    {tts.isSupported && (
                        <Button
                            onClick={() => {
                                if (tts.isSpeaking) {
                                    tts.stop();
                                }
                                setAutoSpeak(!autoSpeak);
                            }}
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-lg sm:rounded-xl ${autoSpeak ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100'}`}
                            title={autoSpeak ? 'Disable auto-speak' : 'Enable auto-speak'}
                        >
                            {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                        </Button>
                    )}
                    {/* Stop speaking button - only show when speaking */}
                    {tts.isSpeaking && (
                        <Button
                            onClick={() => tts.stop()}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-lg sm:rounded-xl bg-red-100 text-red-600 hover:bg-red-200"
                            title="Stop speaking"
                        >
                            <StopCircle className="w-4 h-4" />
                        </Button>
                    )}
                    <Button
                        onClick={handleRefresh}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-lg sm:rounded-xl hover:bg-slate-100"
                        title="Refresh chat"
                    >
                        <RefreshCw className="w-4 h-4 text-slate-500" />
                    </Button>
                    <Button
                        onClick={handleNewChat}
                        variant="outline"
                        size="sm"
                        className="h-8 sm:h-9 rounded-lg sm:rounded-xl border-slate-200 hover:bg-slate-50 px-2 sm:px-3"
                        title="New chat"
                    >
                        <Plus className="w-4 h-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">New Chat</span>
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 scroll-smooth">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto px-2">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-4 sm:mb-6 shadow-xl shadow-indigo-200/50">
                            <Sparkles size={28} className="sm:hidden text-white" />
                            <Sparkles size={36} className="hidden sm:block text-white" />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 text-center">How can I help you today?</h3>
                        <p className="text-sm sm:text-base text-slate-500 text-center mb-6 sm:mb-8 max-w-md">
                            I'm your AI assistant for resource allocation. Ask me about team optimization, project insights, or workload balancing.
                        </p>
                        
                        {/* Quick Prompts */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full max-w-lg">
                            {QUICK_PROMPTS.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(item.prompt)}
                                    className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all text-left group"
                                >
                                    <span className="text-xl sm:text-2xl">{item.icon}</span>
                                    <span className="text-xs sm:text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">{item.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                            >
                                <div className={`flex max-w-[90%] sm:max-w-[85%] gap-2 sm:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Avatar */}
                                    <div className={`flex-shrink-0 w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm ${
                                        msg.role === 'user' 
                                            ? 'bg-gradient-to-br from-slate-700 to-slate-900 text-white' 
                                            : 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white'
                                    }`}>
                                        {msg.role === 'user' ? <User size={14} className="sm:hidden" /> : <Bot size={14} className="sm:hidden" />}
                                        {msg.role === 'user' ? <User size={16} className="hidden sm:block" /> : <Bot size={16} className="hidden sm:block" />}
                                    </div>

                                    {/* Bubble */}
                                    <div className="group relative">
                                        <div
                                            className={`p-3 sm:p-4 text-sm sm:text-[15px] leading-relaxed break-words ${
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
                                                        onClick={() => tts.toggle(msg.text)}
                                                        className={`border rounded-lg p-1.5 shadow-sm transition-colors ${
                                                            tts.isSpeaking 
                                                                ? 'bg-red-50 border-red-200 hover:bg-red-100' 
                                                                : 'bg-white border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        {tts.isSpeaking ? (
                                                            <StopCircle size={14} className="text-red-500" />
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
                                <div className="flex gap-2 sm:gap-3">
                                    <div className="flex-shrink-0 w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-sm">
                                        <Bot size={14} className="sm:hidden" />
                                        <Bot size={16} className="hidden sm:block" />
                                    </div>
                                    <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-2xl rounded-tl-md shadow-sm flex items-center gap-2">
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
            <div className="bg-white/80 backdrop-blur-xl border-t border-slate-200/60 p-3 sm:p-4">
                <div className="max-w-3xl mx-auto">
                    {/* Voice Recording Indicator */}
                    {voice.isListening && (
                        <div className="mb-2 sm:mb-3 flex items-center justify-center gap-2 sm:gap-3 py-2 sm:py-3 bg-red-50 border border-red-200 rounded-xl animate-pulse">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-xs sm:text-sm font-medium text-red-600">Listening...</span>
                            <span className="text-xs sm:text-sm text-red-500 truncate max-w-[150px] sm:max-w-none">{voice.transcript || 'Speak now'}</span>
                        </div>
                    )}

                    <div className="relative flex items-end bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-lg shadow-slate-100/50 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={voice.isListening ? 'Listening...' : 'Ask me anything...'}
                            className="w-full pl-3 sm:pl-5 pr-20 sm:pr-28 py-3 sm:py-4 bg-transparent border-0 focus:ring-0 resize-none text-sm sm:text-[15px] max-h-32 text-slate-900 placeholder:text-slate-400 leading-relaxed rounded-xl sm:rounded-2xl"
                            rows={1}
                            style={{ minHeight: '48px' }}
                            disabled={voice.isListening}
                        />
                        <div className="absolute right-2 sm:right-3 bottom-2 sm:bottom-3 flex items-center gap-1 sm:gap-2">
                            {/* Voice Button */}
                            {voice.isSupported && (
                                <button
                                    onClick={voice.toggleListening}
                                    className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all ${
                                        voice.isListening 
                                            ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                    title={voice.isListening ? 'Stop listening' : 'Start voice input'}
                                >
                                    {voice.isListening ? <MicOff size={16} className="sm:hidden" /> : <Mic size={16} className="sm:hidden" />}
                                    {voice.isListening ? <MicOff size={18} className="hidden sm:block" /> : <Mic size={18} className="hidden sm:block" />}
                                </button>
                            )}

                            {/* Send Button */}
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading || voice.isListening}
                                className="p-2 sm:p-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg sm:rounded-xl hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200/50 hover:shadow-indigo-300/50 active:scale-95"
                            >
                                {isLoading ? <Loader2 size={16} className="sm:hidden animate-spin" /> : <Send size={16} className="sm:hidden" />}
                                {isLoading ? <Loader2 size={18} className="hidden sm:block animate-spin" /> : <Send size={18} className="hidden sm:block" />}
                            </button>
                        </div>
                    </div>
                    <p className="text-center mt-2 sm:mt-3 text-[10px] sm:text-xs text-slate-400 hidden sm:block">
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
