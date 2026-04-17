
import { Capacitor } from '@capacitor/core';

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

// Get the correct Ollama URL based on platform
const getOllamaUrl = (): string => {
    const baseUrl = 'http://localhost:11434/api/chat';
    
    // On native Android, localhost refers to the device itself, not the host machine
    if (Capacitor.isNativePlatform()) {
        const platform = Capacitor.getPlatform();
        if (platform === 'android') {
            // Use Android emulator's host IP
            return baseUrl.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
        }
    }
    
    return baseUrl;
};

export class ChatService {
    private chatHistory: ChatMessage[] = [];
    private apiKey: string;
    private apiUrl: string;

    constructor() {
        this.apiKey = 'ollama-local'; // No key needed usually
        this.apiUrl = getOllamaUrl();
        console.log('[ChatService] Using Ollama URL:', this.apiUrl);
    }

    getHistory(): ChatMessage[] {
        return this.chatHistory;
    }

    async sendMessage(userMessage: string): Promise<string> {
        if (!userMessage.trim()) return '';

        // 1. Add user message to history
        this.chatHistory.push({ role: 'user', text: userMessage });

        // 2. Construct payload
        // Ollama expects { model: "llama3", messages: [...], stream: false }
        const messages = this.chatHistory.map(m => ({
            role: m.role === 'model' ? 'assistant' : 'user',
            content: m.text
        }));

        // 3. Call API
        try {
            // We assume 'llama3' is pulled. You can change this to 'mistral' or 'llama2'
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'phi3',
                    messages: messages,
                    stream: false,
                    options: {
                        num_predict: 1024,   // Reduced for faster responses
                        temperature: 0.1,    // Very low for consistent JSON
                        top_p: 0.9,
                        top_k: 20
                    }
                })
            });

            if (!response.ok) {
                let errorDetails = '';
                try {
                    // Check if it's a connection error or server error
                    errorDetails = await response.text();
                } catch {
                    errorDetails = 'Network response was not ok';
                }
                throw new Error(`Ollama API Error: ${response.status}. Ensure Ollama is running (ollama serve). Details: ${errorDetails}`);
            }

            const data = await response.json();

            // 4. Extract response
            const modelText = data.message?.content;

            if (!modelText) {
                throw new Error('No response content from Ollama');
            }

            // 5. Append to history
            this.chatHistory.push({ role: 'model', text: modelText });

            return modelText;

        } catch (error) {
            console.error('ChatService Error:', error);
            throw error;
        }
    }

    clearHistory() {
        this.chatHistory = [];
    }
}

export const chatService = new ChatService();
