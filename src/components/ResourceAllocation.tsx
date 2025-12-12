import { useState } from 'react';
import { AllocationMode, TeamMember } from '@/types/allocation';
import { ModeToggle } from './allocation/ModeToggle';
import { TaskQueue } from './allocation/TaskQueue';
import { TeamTree } from './allocation/TeamTree';
import { AssignmentHistory } from './allocation/AssignmentHistory';
import { OrganizationPanel } from './allocation/OrganizationPanel';
import { HierarchyView } from './allocation/HierarchyView';
import { mockTasks, mockAssignments, mockMembers } from '@/data/mockData';
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { LayoutList, Network } from 'lucide-react';
import { useProjectState } from '@/hooks/useProjectState';
import { AddProjectDialog } from './allocation/AddProjectDialog';
import { MemberCard } from './allocation/MemberCard';
import { SmartChat } from './chat/SmartChat';

export default function ResourceAllocation() {
  const [mode, setMode] = useState<AllocationMode>('auto');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [balanceMode, setBalanceMode] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'hierarchy'>('list');
  const [isGraphInteractive, setIsGraphInteractive] = useState(false);

  const { projects, addProject, addTeam, addMember, moveMember, editProject, deleteProject, editMember, deleteMember } = useProjectState();
  const [activeDragMember, setActiveDragMember] = useState<TeamMember | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: any) => {
    setActiveDragMember(event.active.data.current?.member || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragMember(null);

    // If graph is not interactive and we are in graph mode, do nothing
    if (viewMode === 'hierarchy' && !isGraphInteractive) return;

    if (over && active.id !== over.id) {
      // Find source team
      const memberId = active.id as string;
      const targetTeamId = over.id as string;

      // Find which team the member currently belongs to
      let sourceTeamId = '';
      for (const project of projects) {
        for (const team of project.teams) {
          if (team.members.find(m => m.id === memberId)) {
            sourceTeamId = team.id;
            break;
          }
        }
        if (sourceTeamId) break;
      }

      if (sourceTeamId && sourceTeamId !== targetTeamId) {
        moveMember(memberId, sourceTeamId, targetTeamId);
      } else if (!sourceTeamId && active.data.current?.member) {
        // Dragged from pool/external source - Add as new member instance (Copy/Assign)
        const { id, teamId, ...memberData } = active.data.current.member;
        addMember(targetTeamId, memberData);
      }
    }
  };

  // Collect all members for context (Pool + Project members)
  const allMembers = [
    ...mockMembers,
    ...projects.flatMap(p => p.teams.flatMap(t => t.members))
  ];

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-[#0F1419] noise-texture text-white">
        {/* Header */}
        <div className="border-b border-white/8 backdrop-blur-sm bg-[#0F1419]/80 sticky top-0 z-50">
          <div className="px-8 py-6 flex items-center justify-between">
            <div>
              <h1 className="text-[28px] font-display font-bold text-white mb-1">
                Resource Allocation
              </h1>
              <p className="text-sm text-white/60 font-body">
                Intelligent task assignment with AI-powered matching
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-[#00D9FF]/20 text-[#00D9FF]' : 'text-white/40 hover:text-white'}`}
                  title="List View"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('hierarchy')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'hierarchy' ? 'bg-[#00D9FF]/20 text-[#00D9FF]' : 'text-white/40 hover:text-white'}`}
                  title="Hierarchy View"
                >
                  <Network className="w-4 h-4" />
                </button>
              </div>

              {viewMode === 'hierarchy' && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-md border border-white/10">
                  <span className="text-xs text-white/60">Interactive Mode</span>
                  <button
                    onClick={() => setIsGraphInteractive(!isGraphInteractive)}
                    className={`w-8 h-4 rounded-full transition-colors relative ${isGraphInteractive ? 'bg-[#00D9FF]' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isGraphInteractive ? 'left-[18px]' : 'left-0.5'}`} />
                  </button>
                </div>
              )}

              <div className="h-8 w-px bg-white/10" />
              <AddProjectDialog onSave={addProject} />
              <div className="h-8 w-px bg-white/10" />
              <button
                onClick={() => setBalanceMode(!balanceMode)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${balanceMode
                  ? 'bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/30'
                  : 'bg-white/5 text-white/60 border border-white/8 hover:bg-white/10'
                  }`}
              >
                Balance Mode
              </button>
              <ModeToggle mode={mode} onModeChange={setMode} />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[calc(100vh-97px)]">
          {/* Organization Panel - 20% */}
          {viewMode === 'list' && (
            <div className="w-[25%] border-r border-white/8 bg-[#0F1419]">
              <OrganizationPanel
                members={mockMembers}
                mode={mode}
                balanceMode={balanceMode}
              />
            </div>
          )}

          {/* Team Tree / Hierarchy - Fluid width */}
          <div className={`${viewMode === 'list' ? 'flex-1' : 'w-full'} border-r border-white/8 relative transition-all duration-300`}>
            {viewMode === 'list' ? (
              <TeamTree
                projects={projects}
                mode={mode}
                selectedTaskId={selectedTaskId}
                balanceMode={balanceMode}
                onAddMember={addMember}
                onEditProject={editProject}
                onDeleteProject={deleteProject}
                onEditMember={editMember}
                onDeleteMember={deleteMember}
              />
            ) : (
              <HierarchyView projects={projects} isInteractive={isGraphInteractive} />
            )}
          </div>

          {/* Assignment History - 25% */}
          {viewMode === 'list' && (
            <div className="w-[25%] bg-[#0F1419]">
              <AssignmentHistory assignments={mockAssignments} />
            </div>
          )}
        </div>

        <SmartChat
          projects={projects}
          members={allMembers}
          onAddProject={addProject}
          onAddMember={addMember}
          onMoveMember={moveMember}
        />
      </div>
      <DragOverlay>
        {activeDragMember ? (
          <div className="w-[300px]">
            <MemberCard
              member={activeDragMember}
              mode={mode}
              balanceMode={balanceMode}
              isTaskSelected={false}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
