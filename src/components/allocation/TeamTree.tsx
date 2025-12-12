import { useState, useEffect } from 'react';
import { Project, AllocationMode, AIMatch, Team, TeamMember } from '@/types/allocation';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import { MemberCard } from './MemberCard';
import { getAITaskAssignment } from '@/services/aiService';
import { mockTasks, mockMembers } from '@/data/mockData';
import { useDroppable } from '@dnd-kit/core';
import { AddMemberDialog } from './AddMemberDialog';
import { AddProjectDialog } from './AddProjectDialog';
import { Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TeamTreeProps {
  projects: Project[];
  mode: AllocationMode;
  selectedTaskId: string | null;
  balanceMode: boolean;
  onAddMember: (teamId: string, member: Omit<TeamMember, 'id' | 'teamId'>) => void;
  onEditProject: (projectId: string, updates: Partial<Project>) => void;
  onDeleteProject: (projectId: string) => void;
  onEditMember: (memberId: string, updates: Partial<TeamMember>) => void;
  onDeleteMember: (memberId: string) => void;
}

interface TeamNodeProps {
  team: Team;
  expanded: boolean;
  onToggle: () => void;
  mode: AllocationMode;
  balanceMode: boolean;
  selectedTaskId: string | null;
  aiMatches: AIMatch[];
  onAddMember: (teamId: string, member: Omit<TeamMember, 'id' | 'teamId'>) => void;
  onEditMember: (memberId: string, updates: Partial<TeamMember>) => void;
  onDeleteMember: (memberId: string) => void;
}

function TeamNode({ team, expanded, onToggle, mode, balanceMode, selectedTaskId, aiMatches, onAddMember, onEditMember, onDeleteMember }: TeamNodeProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: team.id,
    data: { team }
  });

  return (
    <div ref={setNodeRef} className={`rounded-lg transition-colors ${isOver ? 'bg-white/10 ring-1 ring-[#00D9FF]' : ''}`}>
      {/* Team Header */}
      <div className="flex items-center gap-2 pr-2 group">
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
        >
          {expanded ? (
            <ChevronDown className="w-3 h-3 text-white/60" />
          ) : (
            <ChevronRight className="w-3 h-3 text-white/60" />
          )}
          <Users className="w-3 h-3 text-white/60" />
          <span className="text-sm font-body font-medium text-white/90 group-hover:text-white transition-colors">
            {team.name}
          </span>
          <span className="text-xs font-mono text-white/40 ml-auto">
            {team.members.length} members
          </span>
        </button>
        <AddMemberDialog onSave={(member) => onAddMember(team.id, member)} />
      </div>

      {/* Members */}
      {expanded && (
        <div className="ml-6 mt-2 space-y-2 pb-2">
          {team.members.map((member) => {
            const aiMatch = aiMatches.find((m) => m.memberId === member.id);
            return (
              <MemberCard
                key={member.id}
                member={member}
                mode={mode}
                balanceMode={balanceMode}
                isTaskSelected={!!selectedTaskId}
                aiMatch={aiMatch}
                onEdit={(updates) => onEditMember(member.id, updates)}
                onDelete={() => onDeleteMember(member.id)}
              />
            );
          })}
          {team.members.length === 0 && (
            <div className="text-xs text-white/20 font-mono text-center py-2 border border-dashed border-white/10 rounded">
              Drop members here
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TeamTree({ projects, mode, selectedTaskId, balanceMode, onAddMember, onEditProject, onDeleteProject, onEditMember, onDeleteMember }: TeamTreeProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(projects.map((p) => p.id))
  );
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(
    new Set(projects.flatMap((p) => p.teams.map((t) => t.id)))
  );
  const [aiMatches, setAiMatches] = useState<AIMatch[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  useEffect(() => {
    // Refresh expanded states when projects change (new projects/teams)
    // This is a simple heuristic; you might want more sophisticated state preservation logic
    projects.forEach(p => {
      if (!expandedProjects.has(p.id)) {
        // New project? maybe keep it collapsed or auto expand
      }
    });
  }, [projects]);


  useEffect(() => {
    if (mode === 'auto' && selectedTaskId) {
      const task = mockTasks.find((t) => t.id === selectedTaskId);
      if (task) {
        setIsLoadingAI(true);
        // Note: We are using mockMembers here for AI generation context
        // Ideally we should pass the current state members
        getAITaskAssignment(task, mockMembers)
          .then((matches) => {
            setAiMatches(matches);
            setIsLoadingAI(false);
          })
          .catch(() => {
            setIsLoadingAI(false);
          });
      }
    } else {
      setAiMatches([]);
    }
  }, [mode, selectedTaskId]);

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const toggleTeam = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-white/8">
        <h2 className="text-lg font-display font-bold text-white">Team Structure</h2>
        <p className="text-xs text-white/60 mt-1 font-body">
          {mode === 'auto' ? (
            isLoadingAI ? (
              <span className="text-[#00D9FF] animate-pulse">AI analyzing matches...</span>
            ) : (
              'AI will suggest best matches'
            )
          ) : (
            'Drag to reassign members'
          )}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {projects.map((project) => (
          <div key={project.id} className="mb-4">
            {/* Project Header */}
            <button
              onClick={() => toggleProject(project.id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group"
            >
              {expandedProjects.has(project.id) ? (
                <ChevronDown className="w-4 h-4 text-white/60" />
              ) : (
                <ChevronRight className="w-4 h-4 text-white/60" />
              )}
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-display font-medium text-white/90">
                  {project.name}
                </h3>
                {project.requirements && project.requirements.length > 0 && (
                  <div className="flex gap-1">
                    {project.requirements.map((req, i) => (
                      <span key={i} className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-white/50 border border-white/5">
                        {req.role}: {req.count}
                      </span>
                    ))}
                  </div>
                )}
                <span className="text-xs text-white/40 font-mono">
                  {project.teams.reduce((acc, t) => acc + t.members.length, 0)}{' '}
                  members
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" onClick={(e) => e.stopPropagation()}>
                <AddProjectDialog
                  project={project}
                  onSave={(name) => onEditProject(project.id, { name })}
                  trigger={
                    <button className="p-1 hover:bg-white/10 rounded transition-colors text-white/40 hover:text-white">
                      <Pencil className="w-3 h-3" />
                    </button>
                  }
                />

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="p-1 hover:bg-white/10 rounded transition-colors text-white/40 hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#151a21] border-white/10 text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                      <AlertDialogDescription className="text-white/60">
                        This will permanently delete "{project.name}" and all its teams and members. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDeleteProject(project.id)}
                        className="bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/30"
                      >
                        Delete Project
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </button>

            {/* Teams */}
            {expandedProjects.has(project.id) && (
              <div className="ml-6 mt-2 space-y-2 border-l border-white/5 pl-4">
                {project.teams.map((team) => (
                  <TeamNode
                    key={team.id}
                    team={team}
                    expanded={expandedTeams.has(team.id)}
                    onToggle={() => toggleTeam(team.id)}
                    mode={mode}
                    balanceMode={balanceMode}
                    selectedTaskId={selectedTaskId}
                    aiMatches={aiMatches}
                    onAddMember={onAddMember}
                    onEditMember={onEditMember}
                    onDeleteMember={onDeleteMember}

                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
