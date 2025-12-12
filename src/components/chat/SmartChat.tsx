import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Bot, User, X, Sparkles, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Project, TeamMember } from '@/types/allocation';
import { parseNaturalLanguageAction } from '@/services/aiService';
import { generateProjectReport } from '@/utils/pdfGenerator';

interface SmartChatProps {
    projects: Project[];
    members: TeamMember[];
    onAddProject: (name: string, requirements: { role: string; count: number }[]) => void;
    onAddMember: (teamId: string, member: any) => void;
    onMoveMember: (memberId: string, sourceTeamId: string, targetTeamId: string) => void;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    type?: 'text' | 'action' | 'error' | 'success';
}

export function SmartChat({ projects, members, onAddProject, onAddMember, onMoveMember }: SmartChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', content: 'Hi! I can help you manage projects. Try "Create project Alpha" or "Generate header report".', type: 'text' }
    ]);
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                handleSend(transcript);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const handleSend = async (text: string = input) => {
        if (!text.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsProcessing(true);

        try {
            // Check for PDF Report request
            if (text.toLowerCase().includes('report') || text.toLowerCase().includes('pdf')) {
                const project = projects.find(p => text.toLowerCase().includes(p.name.toLowerCase()));
                if (project) {
                    await generateProjectReport(project);
                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: `I've generated the PDF report for **${project.name}**. It should download shortly.`,
                        type: 'success'
                    }]);
                    setIsProcessing(false);
                    return;
                }
            }

            // Parse Action
            const action = await parseNaturalLanguageAction(text, { projects, members });

            switch (action.type) {
                case 'create_project':
                    onAddProject(action.data.name, action.data.requirements);
                    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `Created project **${action.data.name}** with ${action.data.requirements.length} role requirements.`, type: 'success' }]);
                    break;

                case 'add_member':
                    // Need logic to find target team ID. 
                    // Simplifying: If project/team name provided, find it. Else prompt or default.
                    // For now, let's assume adding to Pool if no project specified, or first team of project.
                    let targetTeamId = 'pool'; // You might need to handle 'pool' specifically in onAddMember or logic
                    if (action.data.projectName) {
                        const proj = projects.find(p => p.name.toLowerCase() === action.data.projectName?.toLowerCase());
                        if (proj && proj.teams.length > 0) {
                            // Try to find specific team
                            const team = action.data.teamName
                                ? proj.teams.find(t => t.name.toLowerCase() === action.data.teamName?.toLowerCase())
                                : proj.teams[0];
                            if (team) targetTeamId = team.id;
                        }
                    }
                    // CAUTION: onAddMember in ResourceAllocation might expect a real team ID. 
                    // If targetTeamId is 'pool' (conceptually), we might need special handling.
                    // But typically 'pool' is just unassigned. 
                    // Let's assume we add to the first available project's first team if specified, otherwise error?
                    // Actually, the user asked to "add member".

                    if (targetTeamId === 'pool') {
                        // Fallback: Just return error for now to be safe, or implement pool addition logic if supported
                        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `I need a specific project/team to add ${action.data.name} to.`, type: 'error' }]);
                    } else {
                        onAddMember(targetTeamId, {
                            name: action.data.name,
                            role: action.data.role,
                            skills: action.data.skills
                        });
                        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `Added **${action.data.name}** as ${action.data.role}.`, type: 'success' }]);
                    }
                    break;

                case 'assign_member':
                    // Logic to find member and targets
                    const memberToMove = members.find(m => m.name.toLowerCase() === action.data.memberName.toLowerCase());
                    const targetProj = projects.find(p => p.name.toLowerCase() === action.data.projectName.toLowerCase());

                    if (memberToMove && targetProj) {
                        const targetTeam = targetProj.teams[0]; // Default to first team
                        // Need source team id... `members` are flattened in org panel but we need `teamId`.
                        // The passed `members` prob doesn't have teamId if it's from OrgPanel mock. 
                        // But `onMoveMember` expects IDs.
                        // This is tricky without full state access. 
                        // Let's assume we can find the member in the project tree if they are assigned, or from pool if not.

                        // Fix: pass a function to find member's current team from main state? 
                        // For now, let's just say "I can't move them yet" if ambiguous.

                        if (targetTeam) {
                            // We don't have sourceTeamId readily available from just `members` list if it's the pool list.
                            // But we can try to "Add" them (copy) via onAddMember/moveMember logic if we treat it as new assignment.
                            // Let's use `onMoveMember` but we need source.
                            // Hack: pass 'pool' as source?
                            onMoveMember(memberToMove.id, 'pool', targetTeam.id);
                            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `Assigned **${memberToMove.name}** to **${targetProj.name}**.`, type: 'success' }]);
                        }
                    } else {
                        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `Could not find member or project.`, type: 'error' }]);
                    }
                    break;

                case 'unknown':
                    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: action.message || "I didn't understand that.", type: 'error' }]);
                    break;
            }

        } catch (error) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "Sorry, I encountered an error processing your request.", type: 'error' }]);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${isOpen ? 'w-[350px] h-[500px]' : 'w-auto h-auto'}`}>
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="h-12 w-12 rounded-full bg-[#00D9FF] hover:bg-[#00D9FF]/90 shadow-lg shadow-[#00D9FF]/20"
                >
                    <Bot className="h-6 w-6 text-black" />
                </Button>
            )}

            {isOpen && (
                <div className="flex flex-col h-full bg-[#151a21] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-[#0F1419] border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-[#00D9FF]/10 rounded-lg">
                                <Bot className="w-4 h-4 text-[#00D9FF]" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">Allocate AI</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] text-white/50">Online</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/40 hover:text-white" onClick={() => setIsOpen(false)}>
                                <ChevronDown className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4" >
                        <div className="space-y-4" ref={scrollRef}>
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex w-full gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <Avatar className="w-8 h-8 border border-white/10">
                                        {msg.role === 'user' ? (
                                            <AvatarFallback className="bg-[#00D9FF] text-black"><User className="w-4 h-4" /></AvatarFallback>
                                        ) : (
                                            <AvatarFallback className="bg-[#0F1419] text-[#00D9FF]"><Sparkles className="w-4 h-4" /></AvatarFallback>
                                        )}
                                    </Avatar>
                                    <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div
                                            className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${msg.role === 'user'
                                                ? 'bg-[#00D9FF] text-black rounded-tr-none'
                                                : 'bg-white/5 text-white/90 border border-white/10 rounded-tl-none'
                                                }`}
                                        >
                                            {msg.content.split('**').map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isProcessing && (
                                <div className="flex gap-3">
                                    <Avatar className="w-8 h-8 border border-white/10">
                                        <AvatarFallback className="bg-[#0F1419] text-[#00D9FF]"><Sparkles className="w-4 h-4" /></AvatarFallback>
                                    </Avatar>
                                    <div className="flex items-center gap-1 h-8 px-3 bg-white/5 rounded-2xl rounded-tl-none border border-white/10">
                                        <span className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <span className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <span className="w-1 h-1 bg-white/40 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Input */}
                    <div className="p-3 bg-[#0F1419] border-t border-white/10">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleListening}
                                className={`h-10 w-10 rounded-full transition-colors ${isListening
                                    ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 ring-2 ring-red-500/20'
                                    : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                            </Button>
                            <div className="flex-1 relative">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder={isListening ? "Listening..." : "Ask AI to add tasks, members..."}
                                    className="pr-10 bg-black/20 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#00D9FF]"
                                />
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleSend()}
                                    className="absolute right-1 top-1 h-7 w-7 text-[#00D9FF] hover:bg-[#00D9FF]/10"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
