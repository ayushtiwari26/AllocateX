import { TeamMember, AllocationMode } from '@/types/allocation';
import { MemberCard } from './MemberCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users } from 'lucide-react';

interface OrganizationPanelProps {
    members: TeamMember[];
    mode: AllocationMode;
    balanceMode: boolean;
}

export function OrganizationPanel({ members, mode, balanceMode }: OrganizationPanelProps) {
    return (
        <div className="h-full flex flex-col bg-[#0F1419] border-r border-white/8">
            <div className="px-6 py-4 border-b border-white/8">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#00D9FF]" />
                    <h2 className="text-lg font-display font-bold text-white">Organization Pool</h2>
                </div>
                <p className="text-xs text-white/60 mt-1 font-body">
                    Drag members to assign to projects
                </p>
            </div>

            <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                    {members.map((member) => (
                        <div key={member.id} className="relative">
                            <MemberCard
                                member={member}
                                mode={mode}
                                balanceMode={balanceMode}
                                isTaskSelected={false}
                                draggableId={`pool-${member.id}`}
                            />
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
