import { Project, Team } from '@/types/allocation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useDroppable } from '@dnd-kit/core';
import { MemberCard } from './MemberCard';

interface HierarchyViewProps {
    projects: Project[];
    isInteractive?: boolean;
}

function HierarchyTeamNode({ team, isInteractive }: { team: Team, isInteractive?: boolean }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `team-node-${team.id}`,
        disabled: !isInteractive
    });

    return (
        <div
            ref={setNodeRef}
            className={`bg-[#151a21] border p-3 rounded-lg w-64 transition-colors ${isOver ? 'ring-2 ring-[#00D9FF] bg-[#00D9FF]/10' : 'border-white/10'
                }`}
        >
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                <div className="w-2 h-2 rounded-full bg-[#00D9FF]" />
                <span className="text-white font-medium text-sm">{team.name}</span>
            </div>

            {/* Level 4: Members */}
            <div className="space-y-2">
                {team.members.map((member) => (
                    <div key={member.id} className="relative">
                        {isInteractive ? (
                            <MemberCard
                                member={member}
                                mode="manual"
                                balanceMode={false}
                                isTaskSelected={false}
                                draggableId={`graph-${member.id}`}
                            />
                        ) : (
                            <div className="flex items-center gap-2 bg-white/5 p-2 rounded border border-white/5">
                                <Avatar className="w-6 h-6">
                                    <AvatarImage src={member.avatar} />
                                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <div className="text-white text-xs truncate">{member.name}</div>
                                    <div className="text-white/40 text-[10px] truncate">{member.role}</div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {team.members.length === 0 && (
                    <div className="text-white/20 text-[10px] italic text-center py-4 bg-white/5 border-dashed border border-white/10 rounded">
                        {isInteractive ? 'Drop members here' : 'No members'}
                    </div>
                )}
            </div>
        </div>
    );
}

export function HierarchyView({ projects, isInteractive = false }: HierarchyViewProps) {
    return (
        <div className="h-full overflow-auto p-8 bg-[#0F1419]">
            <div className="flex flex-col items-center">
                {/* Root Node: Organization */}
                <div className="flex flex-col items-center mb-12 relative">
                    <div className="bg-[#00D9FF]/20 border border-[#00D9FF] px-6 py-3 rounded-xl backdrop-blur-sm z-10 relative shadow-lg shadow-[#00D9FF]/10">
                        <span className="text-[#00D9FF] font-display font-bold text-lg">AllocateX Organization</span>
                    </div>
                    {/* Vertical Line from Root */}
                    {projects.length > 0 && (
                        <div className="h-12 w-px bg-white/20 absolute top-full left-1/2 -translate-x-1/2" />
                    )}
                </div>

                {/* Level 2: Projects */}
                <div className="flex gap-24 relative">
                    {/* Horizontal connector for projects */}
                    {projects.length > 1 && (
                        <div className="absolute -top-12 left-0 right-0 h-px bg-white/20 mx-[calc(50%/var(--count))] w-[calc(100%-100%/var(--count))]"
                            style={{ '--count': projects.length } as any} />
                    )}

                    {projects.map((project, idx) => (
                        <div key={project.id} className="flex flex-col items-center relative">
                            {/* Connector from horizontal line to node */}
                            <div className="h-12 w-px bg-white/20 absolute -top-12 left-1/2 -translate-x-1/2" />

                            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-lg mb-8 w-56 text-center shadow-sm z-10 backdrop-blur-sm">
                                <h3 className="text-white font-bold truncate">{project.name}</h3>
                                <div className="mt-2 flex items-center justify-center gap-2">
                                    <Badge variant="secondary" className="text-[10px] h-5 bg-white/10 text-white hover:bg-white/20">
                                        {project.teams.length} Teams
                                    </Badge>
                                </div>
                                {project.requirements && project.requirements.length > 0 && (
                                    <div className="mt-2 text-[10px] text-left text-white/50 border-t border-white/10 pt-2">
                                        <div className="font-semibold mb-1">Needs:</div>
                                        <div className="grid grid-cols-1 gap-1">
                                            {project.requirements.map((req, rIdx) => (
                                                <div key={rIdx} className="flex justify-between">
                                                    <span>{req.role}</span>
                                                    <span>{req.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Level 3: Teams */}
                            <div className="flex flex-col gap-6 relative">
                                {project.teams.length > 0 && (
                                    <div className="h-8 w-px bg-white/20 absolute -top-8 left-1/2 -translate-x-1/2" />
                                )}
                                {project.teams.map((team) => (
                                    <div key={team.id} className="flex flex-col items-center relative pl-8">
                                        {/* Connector to parent project (simplified vertical stack for teams) */}
                                        <div className="absolute top-0 left-0 w-8 h-px bg-white/20 translate-y-4" />
                                        <div className="absolute top-0 left-0 w-px h-full bg-white/20 -translate-y-6" />

                                        <HierarchyTeamNode team={team} isInteractive={isInteractive} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
