import { useState, useEffect } from 'react';
import { Project, AllocationMode, AIMatch } from '@/types/allocation';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import { MemberCard } from './MemberCard';
import { getAITaskAssignment } from '@/services/aiService';
import { mockTasks, mockMembers } from '@/data/mockData';

interface TeamTreeProps {
  projects: Project[];
  mode: AllocationMode;
  selectedTaskId: string | null;
  balanceMode: boolean;
}

export function TeamTree({ projects, mode, selectedTaskId, balanceMode }: TeamTreeProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(projects.map((p) => p.id))
  );
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(
    new Set(projects.flatMap((p) => p.teams.map((t) => t.id)))
  );
  const [aiMatches, setAiMatches] = useState<AIMatch[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  useEffect(() => {
    if (mode === 'auto' && selectedTaskId) {
      const task = mockTasks.find((t) => t.id === selectedTaskId);
      if (task) {
        setIsLoadingAI(true);
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
            'Select any team member'
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
              <span className="text-sm font-display font-bold text-white group-hover:text-[#00D9FF] transition-colors">
                {project.name}
              </span>
              <span className="text-xs font-mono text-white/40 ml-auto">
                {project.teams.length} teams
              </span>
            </button>

            {/* Teams */}
            {expandedProjects.has(project.id) && (
              <div className="ml-6 mt-2 space-y-2 border-l border-white/5 pl-4">
                {project.teams.map((team) => (
                  <div key={team.id}>
                    {/* Team Header */}
                    <button
                      onClick={() => toggleTeam(team.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group"
                    >
                      {expandedTeams.has(team.id) ? (
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

                    {/* Members */}
                    {expandedTeams.has(team.id) && (
                      <div className="ml-6 mt-2 space-y-2">
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
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
