import { useState, useEffect } from 'react';
import { Project, AllocationMode, AIMatch, Team } from '@/types/allocation';
import { ChevronDown, ChevronRight, Users, Plus, Pencil, Trash2 } from 'lucide-react';
import { MemberCard } from './MemberCard';
import { getAITaskAssignment } from '@/services/aiService';
import { mockTasks, mockMembers } from '@/data/mockData';
import { useDroppable } from '@dnd-kit/core';
import { AddMemberDialog } from './AddMemberDialog';
import { AddProjectDialog, type ProjectFormValues, type ManagerOption } from './AddProjectDialog';
import { AddTeamDialog } from './AddTeamDialog';
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
  onAssignMember: (projectId: string, teamId: string, payload: { employeeId: string; role: string; allocationPercentage?: number }) => Promise<void>;
  onEditProject: (projectId: string, values: ProjectFormValues) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  managerOptions: ManagerOption[];
  onUpdateMember: (projectId: string, teamId: string, memberId: string, updates: { role?: string; allocationPercentage?: number }) => Promise<void>;
  onDeleteMember: (projectId: string, teamId: string, memberId: string, employeeId?: string) => Promise<void>;
  onCreateTeam: (projectId: string, payload: { name: string; description?: string }) => Promise<void>;
}

interface TeamNodeProps {
  project: Project;
  team: Team;
  expanded: boolean;
  onToggle: () => void;
  mode: AllocationMode;
  balanceMode: boolean;
  selectedTaskId: string | null;
  aiMatches: AIMatch[];
  onAssignMember: (payload: { employeeId: string; role: string; allocationPercentage?: number }) => Promise<void>;
  onUpdateMember: (memberId: string, updates: { role?: string; allocationPercentage?: number }) => Promise<void>;
  onDeleteMember: (memberId: string, employeeId?: string) => Promise<void>;
}

function TeamNode({ project, team, expanded, onToggle, mode, balanceMode, selectedTaskId, aiMatches, onAssignMember, onUpdateMember, onDeleteMember }: TeamNodeProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: team.id,
    data: { team }
  });
  const projectMembers = project.teams.flatMap((teamEntry) => teamEntry.members);

  return (
    <div ref={setNodeRef} className={`rounded-lg transition-colors ${isOver ? 'bg-indigo-50 ring-1 ring-indigo-500' : ''}`}>
      {/* Team Header */}
      <div className="flex items-center gap-2 pr-2 group">
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
        >
          {expanded ? (
            <ChevronDown className="w-3 h-3 text-gray-500" />
          ) : (
            <ChevronRight className="w-3 h-3 text-gray-500" />
          )}
          <Users className="w-3 h-3 text-gray-500" />
          <span className="text-sm font-medium text-gray-900 group-hover:text-black transition-colors">
            {team.name}
          </span>
          <span className="text-xs font-mono text-gray-400 ml-auto">
            {team.members.length} members
          </span>
        </button>
        <AddMemberDialog
          projectId={project.id}
          projectName={project.name}
          teamId={team.id}
          teamName={team.name}
          requirements={team.requirements?.length ? team.requirements : project.requirements}
          teamMembers={team.members}
          projectMembers={projectMembers}
          onAssign={onAssignMember}
        />
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
                projectId={project.id}
                projectName={project.name}
                teamId={team.id}
                teamName={team.name}
                requirements={team.requirements?.length ? team.requirements : project.requirements}
                teamMembers={team.members}
                projectMembers={projectMembers}
                onEdit={(updates) => onUpdateMember(member.id, updates)}
                onDelete={() => onDeleteMember(member.id, member.employeeId)}
              />
            );
          })}
          {team.members.length === 0 && (
            <div className="text-xs text-gray-400 font-mono text-center py-2 border border-dashed border-gray-200 rounded">
              Drop members here
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TeamTree({ projects, mode, selectedTaskId, balanceMode, onAssignMember, onEditProject, onDeleteProject, managerOptions, onUpdateMember, onDeleteMember, onCreateTeam }: TeamTreeProps) {
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

  const countMembersForRole = (project: Project, role: string) => {
    const normalizedRole = (role ?? '').trim().toLowerCase();
    if (!normalizedRole) return 0;
    return project.teams.reduce((total, team) => {
      const matchCount = team.members.filter((member) => (member.role || '').toLowerCase() === normalizedRole).length;
      return total + matchCount;
    }, 0);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold tracking-tight text-gray-900">Team Structure</h2>
        <p className="text-xs text-gray-500 mt-1">
          {mode === 'auto' ? (
            isLoadingAI ? (
              <span className="text-indigo-600 animate-pulse">AI analyzing matches...</span>
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
            <div className="w-full flex flex-col gap-2 rounded-lg bg-white/80 transition hover:bg-white shadow-sm border border-transparent hover:border-gray-200">
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleProject(project.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleProject(project.id);
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-t-lg group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
              {expandedProjects.has(project.id) ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-900">
                  {project.name}
                </h3>
                {project.requirements && project.requirements.length > 0 && (
                  <div className="flex gap-1">
                    {project.requirements.map((req, index) => {
                      const filled = countMembersForRole(project, req.role);
                      const target = req.count ?? 0;
                      const fulfilled = target > 0 ? filled >= target : false;
                      const badgeClass = fulfilled
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-amber-50 border-amber-200 text-amber-700';
                      return (
                        <span
                          key={`${req.role}-${index}`}
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${badgeClass}`}
                        >
                          {req.role}: {target > 0 ? `${filled}/${target}` : filled}
                        </span>
                      );
                    })}
                  </div>
                )}
                <span className="text-xs text-gray-400 font-mono">
                  {project.teams.reduce((acc, t) => acc + t.members.length, 0)}{' '}
                  members
                </span>
              </div>
                <div
                  className="flex items-center gap-1 ml-auto"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <AddTeamDialog
                    projectId={project.id}
                    projectName={project.name}
                    onCreate={onCreateTeam}
                    trigger={
                      <button className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded">
                        <Plus className="w-3 h-3" /> Squad
                      </button>
                    }
                  />

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <AddProjectDialog
                      project={project}
                      managers={managerOptions}
                      onSubmit={(values) => onEditProject(project.id, values)}
                      trigger={
                        <button className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-400 hover:text-gray-900">
                          <Pencil className="w-3 h-3" />
                        </button>
                      }
                    />

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-400 hover:text-red-500">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white border-gray-200 text-gray-900 shadow-xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-500">
                            This will permanently delete "{project.name}" and all its teams and members. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-transparent border-gray-200 text-gray-900 hover:bg-gray-100">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              try {
                                await onDeleteProject(project.id);
                              } catch (error) {
                                console.error('Delete project error:', error);
                              }
                            }}
                            className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                          >
                            Delete Project
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </div>

            {/* Teams */}
            {expandedProjects.has(project.id) && (
              <div className="ml-6 mt-2 space-y-2 border-l border-gray-200 pl-4">
                {project.teams.length === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-sm text-gray-500 flex flex-col items-start gap-3">
                    <span>No squads yet. Create one to start allocating members.</span>
                    <AddTeamDialog
                      projectId={project.id}
                      projectName={project.name}
                      onCreate={onCreateTeam}
                      trigger={
                        <button className="px-3 py-1.5 rounded border border-indigo-200 text-xs font-medium text-indigo-600 hover:bg-indigo-50">
                          <Plus className="w-3 h-3 inline mr-1" /> Create first squad
                        </button>
                      }
                    />
                  </div>
                )}

                {project.teams.map((team) => (
                  <TeamNode
                    key={team.id}
                    project={project}
                    team={team}
                    expanded={expandedTeams.has(team.id)}
                    onToggle={() => toggleTeam(team.id)}
                    mode={mode}
                    balanceMode={balanceMode}
                    selectedTaskId={selectedTaskId}
                    aiMatches={aiMatches}
                    onAssignMember={(payload) => onAssignMember(project.id, team.id, payload)}
                    onUpdateMember={(memberId, updates) => onUpdateMember(project.id, team.id, memberId, updates)}
                    onDeleteMember={(memberId, employeeId) => onDeleteMember(project.id, team.id, memberId, employeeId)}

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
