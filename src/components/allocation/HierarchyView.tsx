import { Project, Team, TeamMember } from '@/types/allocation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useDroppable } from '@dnd-kit/core';
import { MemberCard } from './MemberCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, GripVertical } from 'lucide-react';

interface HierarchyViewProps {
    projects: Project[];
    isInteractive?: boolean;
    poolMembers?: TeamMember[];
}

function HierarchyTeamNode({ project, team, isInteractive }: { project: Project; team: Team; isInteractive?: boolean }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `team-node-${team.id}`,
        disabled: !isInteractive
    });

    return (
        <div
            ref={setNodeRef}
            className={`bg-white border p-3 rounded-lg w-64 transition-colors shadow-sm ${isOver ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'border-gray-200'
                }`}
        >
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-gray-900 font-medium text-sm">{team.name}</span>
            </div>

            {/* Level 4: Members */}
            <div className="space-y-2">
                {team.members.map((member) => (
                    <div key={member.id} className="relative">
                        {isInteractive ? (
                            <MemberCard
                                member={member}
                                projectId={project.id}
                                projectName={project.name}
                                teamId={team.id}
                                teamName={team.name}
                                requirements={team.requirements}
                                mode="manual"
                                balanceMode={false}
                                isTaskSelected={false}
                                draggableId={`graph-${member.id}`}
                            />
                        ) : (
                            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200">
                                <Avatar className="w-6 h-6">
                                    <AvatarImage src={member.avatar} />
                                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <div className="text-gray-900 text-xs truncate">{member.name}</div>
                                    <div className="text-gray-500 text-[10px] truncate">{member.role}</div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {team.members.length === 0 && (
                    <div className="text-gray-400 text-[10px] italic text-center py-4 bg-gray-50 border-dashed border border-gray-200 rounded">
                        {isInteractive ? 'Drop members here' : 'No members'}
                    </div>
                )}
            </div>
        </div>
    );
}

export function HierarchyView({ projects, isInteractive = false, poolMembers = [] }: HierarchyViewProps) {
    return (
        <div className="h-full flex overflow-hidden bg-gray-50">
            {/* Organization Pool Sidebar - Only in interactive mode */}
            {isInteractive && poolMembers.length > 0 && (
                <div className="w-72 border-r border-gray-200 bg-white flex flex-col shrink-0">
                    <div className="px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-600" />
                            <h3 className="text-sm font-semibold text-gray-900">Organization Pool</h3>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Drag members onto teams
                        </p>
                    </div>
                    <ScrollArea className="flex-1 p-2">
                        <div className="space-y-2">
                            {poolMembers.map((member) => (
                                <div key={member.id} className="relative">
                                    <MemberCard
                                        member={member}
                                        projectId="pool"
                                        projectName="Organization Pool"
                                        teamId="pool"
                                        teamName="Available"
                                        requirements={[]}
                                        mode="manual"
                                        balanceMode={false}
                                        isTaskSelected={false}
                                        draggableId={`pool-graph-${member.id}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}

            {/* Hierarchy Graph */}
            <div className="flex-1 overflow-auto p-8">
                <div className="flex flex-col items-center min-w-max">
                {/* Root Node: Organization */}
                <div className="flex flex-col items-center mb-12 relative">
                    <div className="bg-white border border-indigo-100 px-6 py-3 rounded-xl z-20 relative shadow-sm ring-1 ring-indigo-500/10">
                        <span className="text-indigo-600 font-display font-bold text-lg">AllocateX Organization</span>
                    </div>
                    {/* Vertical Line from Root */}
                    {projects.length > 0 && (
                        <div className="h-12 w-px bg-gray-300 absolute top-full left-1/2 -translate-x-1/2" />
                    )}
                </div>

                {/* Level 2: Projects */}
                <div className="flex gap-24 relative">
                    {/* Horizontal connector for projects */}
                    {projects.length > 1 && (
                        <div className="absolute -top-12 left-0 right-0 h-px bg-gray-300 mx-[calc(50%/var(--count))] w-[calc(100%-100%/var(--count))]"
                            style={{ '--count': projects.length } as any} />
                    )}

                    {projects.map((project, idx) => (
                        <div key={project.id} className="flex flex-col items-center relative">
                            {/* Connector from horizontal line to node */}
                            <div className="h-12 w-px bg-gray-300 absolute -top-12 left-1/2 -translate-x-1/2" />

                            <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg mb-8 w-56 text-center shadow-sm z-10">
                                <h3 className="text-gray-900 font-bold truncate">{project.name}</h3>
                                <div className="mt-2 flex items-center justify-center gap-2">
                                    <Badge variant="secondary" className="text-[10px] h-5 bg-gray-100 text-gray-700 hover:bg-gray-200">
                                        {project.teams.length} Teams
                                    </Badge>
                                </div>
                                {project.requirements && project.requirements.length > 0 && (
                                    <div className="mt-2 text-[10px] text-left text-gray-500 border-t border-gray-100 pt-2">
                                        <div className="font-semibold mb-1 text-gray-700">Needs:</div>
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
                                    <div className="h-8 w-px bg-gray-300 absolute -top-8 left-1/2 -translate-x-1/2" />
                                )}
                                {project.teams.map((team) => (
                                    <div key={team.id} className="flex flex-col items-center relative pl-8">
                                        {/* Connector to parent project (simplified vertical stack for teams) */}
                                        <div className="absolute top-0 left-0 w-8 h-px bg-gray-300 translate-y-4" />
                                        <div className="absolute top-0 left-0 w-px h-full bg-gray-300 -translate-y-6" />

                                        <HierarchyTeamNode project={project} team={team} isInteractive={isInteractive} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                </div>
            </div>
        </div>
    );
}
