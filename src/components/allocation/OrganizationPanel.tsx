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
    // Sort members for smart assignment: Lowest workload first
    const sortedMembers = [...members].sort((a, b) => {
        // Primary: Current Workload (Ascending) - Give 'available' members first
        if (a.currentWorkload !== b.currentWorkload) {
            return a.currentWorkload - b.currentWorkload;
        }
        // Secondary: Velocity (Descending) - More productive people first if tie
        return b.velocity - a.velocity;
    });

    return (
        <div className="h-full flex flex-col bg-gray-50/50 border-r border-gray-200/60">
            <div className="px-5 py-4 bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
                <div className="flex items-center gap-2.5 mb-1">
                    <div className="p-1.5 bg-indigo-50 rounded-md">
                        <Users className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h2 className="text-sm font-semibold tracking-tight text-gray-900">Organization Pool</h2>
                </div>
                <p className="text-[11px] text-gray-500 pl-9">
                    Drag members to assign to projects
                </p>
            </div>

            <ScrollArea className="flex-1 px-3 py-4">
                <div className="space-y-3 pb-4">
                    {sortedMembers.map((member) => (
                        <div key={member.id} className="relative transform transition-all duration-200 hover:scale-[1.02]">
                            <MemberCard
                                member={member}
                                projectId="pool"
                                projectName="Organization Pool"
                                teamId="pool"
                                teamName="Available"
                                requirements={[]}
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
