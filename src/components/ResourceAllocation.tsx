import { useState, useEffect, useCallback } from 'react';
import { AllocationMode, TeamMember, Project, ProjectRequirement, Team } from '@/types/allocation';
import { ModeToggle } from './allocation/ModeToggle';
import { TeamTree } from './allocation/TeamTree';
import { AssignmentHistory, type AssignmentHistoryEntry } from './allocation/AssignmentHistory';
import { OrganizationPanel } from './allocation/OrganizationPanel';
import { HierarchyView } from './allocation/HierarchyView';
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { LayoutList, Network, Bot, Sparkles, Loader2 } from 'lucide-react';
import { useProjectState } from '@/hooks/useProjectState';
import { AddProjectDialog, type ProjectFormValues, type ManagerOption } from './allocation/AddProjectDialog';
import { MemberCard } from './allocation/MemberCard';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { employeeApi, projectApi, type Employee, type Project as BackendProject, type ProjectTeamRecord, type ProjectTeamMemberRecord } from '@/services/api';
import { aiAllocationService } from '@/services/aiAllocationService';
import { allocationReportsService } from '@/services/allocationReportsService';

export default function ResourceAllocation() {
  const [mode, setMode] = useState<AllocationMode>('auto');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [balanceMode, setBalanceMode] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'hierarchy'>('list');
  const [isGraphInteractive, setIsGraphInteractive] = useState(false);

  const { projects, setProjectsState } = useProjectState();
  const [activeDragMember, setActiveDragMember] = useState<TeamMember | null>(null);
  const navigate = useNavigate();

  const [poolMembers, setPoolMembers] = useState<TeamMember[]>([]);
  const [assignmentHistory, setAssignmentHistory] = useState<AssignmentHistoryEntry[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [managerOptions, setManagerOptions] = useState<ManagerOption[]>([]);

  const availabilityMap: Record<'available' | 'partially-available' | 'unavailable', TeamMember['availability']> = {
    'available': 'available',
    'partially-available': 'busy',
    'unavailable': 'overloaded',
  };

  const mapEmployeeToMember = (employee: Employee): TeamMember => {
    const skills = (employee.skills ?? []).map((skill: any) => skill.skillName ?? skill);
    return {
      id: employee.id,
      employeeId: employee.id,
      name: `${employee.firstName} ${employee.lastName}`.trim(),
      role: employee.designation,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(`${employee.firstName} ${employee.lastName}`)}&background=random`,
      skills,
      currentWorkload: employee.currentWorkload ?? 0,
      maxCapacity: employee.maxCapacity ?? 40,
      velocity: employee.velocity ?? 6,
      availability: availabilityMap[employee.availability] ?? 'available',
      teamId: '',
      allocationPercentage: 100,
    };
  };

  const mapTeamMember = (member: ProjectTeamMemberRecord, team: ProjectTeamRecord, project: BackendProject): TeamMember | null => {
    const employee = member.employee;
    if (!employee) return null;
    const skills = (employee.skills ?? []).map(skill => skill.skillName);
    return {
      id: member.id,
      employeeId: member.employeeId,
      name: `${employee.firstName} ${employee.lastName}`.trim(),
      role: member.role,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(`${employee.firstName} ${employee.lastName}`)}&background=random`,
      skills,
      currentWorkload: employee.currentWorkload ?? 0,
      maxCapacity: employee.maxCapacity ?? 40,
      velocity: employee.velocity ?? 6,
      availability: availabilityMap[employee.availability] ?? 'available',
      teamId: team.id,
      allocationPercentage: member.allocationPercentage ?? 100,
    };
  };

  const mapBackendProject = (project: BackendProject): Project => {
    const teams: Team[] = (project.teams ?? []).map((team) => {
      const members = (team.members ?? [])
        .map((member) => mapTeamMember(member, team, project))
        .filter((member): member is TeamMember => Boolean(member));

      const derivedRequirements = members.reduce<Record<string, number>>((acc, member) => {
        acc[member.role] = (acc[member.role] ?? 0) + 1;
        return acc;
      }, {});

      const requirements: ProjectRequirement[] = (team.requirements && team.requirements.length > 0)
        ? team.requirements
        : Object.entries(derivedRequirements).map(([role, count]) => ({ role, count }));

      return {
        id: team.id,
        name: team.name,
        projectId: project.id,
        members,
        requirements,
        description: team.description ?? undefined,
        leadId: team.leadId ?? undefined,
        leadName: team.lead ? `${team.lead.firstName} ${team.lead.lastName}`.trim() : undefined,
      };
    });

    const projectRequirementMap = new Map<string, number>();
    teams.forEach((team) => {
      team.requirements?.forEach((req) => {
        projectRequirementMap.set(req.role, (projectRequirementMap.get(req.role) ?? 0) + (req.count ?? 0));
      });
    });

    const projectRequirements: ProjectRequirement[] = (project.requirements && project.requirements.length > 0)
      ? project.requirements
      : Array.from(projectRequirementMap.entries()).map(([role, count]) => ({ role, count }));

    return {
      id: project.id,
      name: project.name,
      teams,
      requirements: projectRequirements,
      description: project.description ?? undefined,
      status: project.status,
      priority: project.priority,
      managerId: project.managerId,
      startDate: project.startDate,
      endDate: project.endDate,
    };
  };

  const loadInitialData = useCallback(async () => {
    try {
      const [employees, backendProjects] = await Promise.all([
        employeeApi.getAll(),
        projectApi.getAll(),
      ]);

      const mappedProjects = (backendProjects as BackendProject[])
        .filter(p => p.status !== 'cancelled')
        .map(mapBackendProject);

      const formattedManagers: ManagerOption[] = employees.map((employee) => {
        const fullName = `${employee.firstName} ${employee.lastName}`.trim();
        return {
          id: employee.id,
          name: fullName.length ? fullName : employee.email,
          designation: employee.designation,
        };
      });
      setManagerOptions(formattedManagers);

      setProjectsState(mappedProjects);
      const assignedEmployeeIds = new Set<string>();
      mappedProjects.forEach(project => {
        project.teams.forEach(team => {
          team.members.forEach(member => {
            if (member.employeeId) {
              assignedEmployeeIds.add(member.employeeId);
            }
          });
        });
      });

      const availablePool = employees
        .filter(employee => !assignedEmployeeIds.has(employee.id))
        .map(mapEmployeeToMember);

      setPoolMembers(availablePool.length ? availablePool : employees.map(mapEmployeeToMember));
      setAssignmentHistory(buildAssignmentHistory(mappedProjects));
    } catch (error) {
      console.error('Error loading allocation data:', error);
    }
  }, [setProjectsState]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleCreateProject = useCallback(async (values: ProjectFormValues) => {
    try {
      const createdProject = await projectApi.create({
        name: values.name,
        description: values.description,
        managerId: values.managerId || undefined,
        startDate: values.startDate,
        endDate: values.endDate || undefined,
        priority: values.priority,
        status: 'active',
        requirements: values.requirements,
        defaultTeamName: 'Core Team',
      });

      if (!createdProject?.teams || createdProject.teams.length === 0) {
        try {
          await projectApi.addTeam(createdProject.id, { name: 'Core Team' });
        } catch (teamError) {
          console.warn('Default team creation failed', teamError);
        }
      }
      await loadInitialData();
    } catch (error) {
      console.error('Create project error:', error);
      throw error;
    }
  }, [loadInitialData]);

  const handleUpdateProject = useCallback(async (projectId: string, values: ProjectFormValues) => {
    try {
      await projectApi.update(projectId, {
        name: values.name,
        description: values.description,
        managerId: values.managerId || undefined,
        startDate: values.startDate,
        endDate: values.endDate || undefined,
        priority: values.priority,
        requirements: values.requirements,
      });
      await loadInitialData();
    } catch (error) {
      console.error('Update project error:', error);
      throw error;
    }
  }, [loadInitialData]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    try {
      await projectApi.delete(projectId);
      await loadInitialData();
    } catch (error) {
      console.error('Delete project error:', error);
      throw error;
    }
  }, [loadInitialData]);

  const findProjectTeam = useCallback((teamId: string) => {
    for (const project of projects) {
      const team = project.teams.find((t) => t.id === teamId);
      if (team) {
        return { project, team } as { project: Project; team: Team };
      }
    }
    return null;
  }, [projects]);

  const handleAssignMember = useCallback(
    async (
      projectId: string,
      teamId: string,
      payload: { employeeId: string; role: string; allocationPercentage?: number }
    ) => {
      try {
        await projectApi.addMember(projectId, teamId, payload);
        await loadInitialData();
      } catch (error) {
        console.error('Assign member error:', error);
        throw error;
      }
    },
    [loadInitialData]
  );

  const handleUpdateMember = useCallback(
    async (
      projectId: string,
      teamId: string,
      memberId: string,
      updates: { role?: string; allocationPercentage?: number }
    ) => {
      try {
        await projectApi.updateMember(projectId, teamId, memberId, updates);
        await loadInitialData();
      } catch (error) {
        console.error('Update member error:', error);
        throw error;
      }
    },
    [loadInitialData]
  );

  const handleDeleteMember = useCallback(
    async (projectId: string, teamId: string, memberId: string, _employeeId?: string) => {
      try {
        await projectApi.removeMember(projectId, teamId, memberId);
        await loadInitialData();
      } catch (error) {
        console.error('Delete member error:', error);
        throw error;
      }
    },
    [loadInitialData]
  );

  const handleMoveMember = useCallback(
    async (projectId: string, sourceTeamId: string, targetTeamId: string, memberId: string) => {
      try {
        await projectApi.updateMember(projectId, sourceTeamId, memberId, { targetTeamId });
        await loadInitialData();
      } catch (error) {
        console.error('Move member error:', error);
        throw error;
      }
    },
    [loadInitialData]
  );

  const handleCreateTeam = useCallback(
    async (projectId: string, payload: { name: string; description?: string }) => {
      try {
        await projectApi.addTeam(projectId, payload);
        await loadInitialData();
      } catch (error) {
        console.error('Create team error:', error);
        throw error;
      }
    },
    [loadInitialData]
  );

  const buildAssignmentHistory = (projectList: typeof projects): AssignmentHistoryEntry[] => {
    const entries: AssignmentHistoryEntry[] = [];
    projectList.forEach(project => {
      project.teams.forEach(team => {
        team.members.forEach((member, idx) => {
          entries.push({
            id: `${project.id}-${team.id}-${member.id}-${idx}`,
            mode: idx % 2 === 0 ? 'auto' : 'manual',
            assignedAt: new Date(Date.now() - idx * 3600 * 1000).toISOString(),
            assignedBy: idx % 2 === 0 ? undefined : 'Resource Manager',
            aiMatchScore: idx % 2 === 0 ? 0.75 + (idx % 3) * 0.08 : undefined,
            task: {
              id: `${project.id}-task-${idx}`,
              title: `${project.name} • ${member.role}`,
              priority: ['high', 'medium', 'critical', 'medium'][idx % 4] as AssignmentHistoryEntry['task']['priority'],
            },
            member: {
              id: member.id,
              name: member.name,
              avatar: member.avatar,
              role: member.role,
            },
          });
        });
      });
    });

    return entries.slice(0, 20);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleAutoAllocate = async () => {
    setIsOptimizing(true);
    try {
      const plan = await aiAllocationService.generateOptimizationPlan(projects, poolMembers);

      // Save the report to localStorage
      const savedReport = allocationReportsService.saveReport(plan, false);

      console.log('[Allocation] Saved AI report:', savedReport.id);

      // Navigate directly to AI Reports page with the new report
      navigate(`/dashboard/ai-reports/${savedReport.id}`);

    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to generate allocation plan.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleDragStart = (event: any) => {
    setActiveDragMember(event.active.data.current?.member || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragMember(null);

    if (!over) return;
    if (active.id === over.id) return;

    const activeMember = active.data.current?.member as TeamMember | undefined;
    if (!activeMember) return;

    const rawTargetId = String(over.id);
    const targetTeamId = rawTargetId.startsWith('team-node-') ? rawTargetId.replace('team-node-', '') : rawTargetId;
    const targetContext = findProjectTeam(targetTeamId);
    if (!targetContext) return;

    // Move between teams
    if (activeMember.teamId) {
      if (activeMember.teamId === targetTeamId) return;

      const sourceContext = findProjectTeam(activeMember.teamId);
      if (!sourceContext) return;

      try {
        if (sourceContext.project.id === targetContext.project.id) {
          await handleMoveMember(sourceContext.project.id, activeMember.teamId, targetTeamId, activeMember.id);
        } else if (activeMember.employeeId) {
          await handleDeleteMember(sourceContext.project.id, sourceContext.team.id, activeMember.id, activeMember.employeeId);
          await handleAssignMember(targetContext.project.id, targetContext.team.id, {
            employeeId: activeMember.employeeId,
            role: activeMember.role,
            allocationPercentage: activeMember.allocationPercentage ?? 100,
          });
        } else {
          console.warn('Cannot move member across projects without an employee reference.');
        }
      } catch (error) {
        console.error('Drag move failed:', error);
      }
      return;
    }

    // Assign from pool into a team
    if (!activeMember.employeeId) {
      console.warn('Cannot assign member without an employee reference.');
      return;
    }

    try {
      await handleAssignMember(targetContext.project.id, targetContext.team.id, {
        employeeId: activeMember.employeeId,
        role: activeMember.role,
        allocationPercentage: activeMember.allocationPercentage ?? 100,
      });
    } catch (error) {
      console.error('Drag assignment failed:', error);
    }
  };

  const activeDragContext = activeDragMember?.teamId ? findProjectTeam(activeDragMember.teamId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full bg-gray-50/50 text-gray-900 flex flex-col relative font-sans">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Resource Allocation</h2>
            <p className="text-gray-500 text-sm mt-1">
              Optimized task assignment & team balancing
            </p>
          </div>

          <div className="flex items-center gap-6">
            {/* View Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-100 p-1 rounded-md border border-gray-200">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`h-8 px-3 text-xs ${viewMode === 'list' ? 'shadow-sm font-medium' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <LayoutList className="w-3.5 h-3.5 mr-2" /> List
                </Button>
                <Button
                  variant={viewMode === 'hierarchy' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('hierarchy')}
                  className={`h-8 px-3 text-xs ${viewMode === 'hierarchy' ? 'shadow-sm font-medium' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <Network className="w-3.5 h-3.5 mr-2" /> Graph
                </Button>
              </div>

              {viewMode === 'hierarchy' && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-md border border-gray-200 h-8">
                  <Switch
                    id="interactive-mode"
                    checked={isGraphInteractive}
                    onCheckedChange={setIsGraphInteractive}
                    className="scale-75"
                  />
                  <Label htmlFor="interactive-mode" className="text-xs font-medium cursor-pointer text-gray-600">Interactive</Label>
                </div>
              )}
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* Actions & Modes */}
            <div className="flex items-center gap-4">
              {mode === 'auto' && (
                <Button
                  onClick={handleAutoAllocate}
                  disabled={isOptimizing}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2"
                >
                  {isOptimizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isOptimizing ? 'Analyzing...' : 'Auto Allocate Sprint'}
                </Button>
              )}

              {/* <div className="flex items-center space-x-2">
                <Switch
                  id="balance-mode"
                  checked={balanceMode}
                  onCheckedChange={setBalanceMode}
                />
                <Label htmlFor="balance-mode" className="text-sm font-medium text-gray-700">Balance Mode</Label>
              </div> */}

              <ModeToggle mode={mode} onModeChange={setMode} />

              <AddProjectDialog managers={managerOptions} onSubmit={handleCreateProject} />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Organization Panel - 20% */}
          {viewMode === 'list' && (
            <div className="w-80 border-r border-gray-200 bg-white flex flex-col z-30">
              <OrganizationPanel
                members={poolMembers}
                mode={mode}
                balanceMode={balanceMode}
              />
            </div>
          )}

          {/* Team Tree / Hierarchy - Fluid width */}
          <div className="flex-1 overflow-hidden relative">
            {viewMode === 'list' ? (
              <div className="h-full overflow-auto">
                <TeamTree
                  projects={projects}
                  mode={mode}
                  selectedTaskId={selectedTaskId}
                  balanceMode={balanceMode}
                  onAssignMember={handleAssignMember}
                  onEditProject={handleUpdateProject}
                  onDeleteProject={handleDeleteProject}
                  managerOptions={managerOptions}
                  onUpdateMember={handleUpdateMember}
                  onDeleteMember={handleDeleteMember}
                  onCreateTeam={handleCreateTeam}
                />
              </div>
            ) : (
              <HierarchyView projects={projects} isInteractive={isGraphInteractive} poolMembers={poolMembers} />
            )}
          </div>

          {/* Assignment History - 25% */}
          {viewMode === 'list' && (
            <div className="w-80 bg-white border-l border-gray-200 z-30 hidden xl:block">
              <AssignmentHistory assignments={assignmentHistory} />
            </div>
          )}
        </div>

        {/* Floating Chat Button */}
        <button
          onClick={() => navigate('/dashboard/chat')}
          className="absolute bottom-8 right-8 h-14 w-14 bg-black hover:bg-gray-800 text-white rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center justify-center z-50 group hover:scale-105 active:scale-95"
          title="Ask AI Assistant"
        >
          <Bot className="w-6 h-6" />
          <span className="absolute right-full mr-4 px-3 py-1.5 bg-black/90 text-white text-xs font-semibold rounded-md shadow origin-right scale-0 group-hover:scale-100 transition-transform whitespace-nowrap">
            Ask AI Assistant
          </span>
        </button>

      </div>
      <DragOverlay>
        {activeDragMember ? (
          <div className="w-[300px] shadow-2xl rotate-2 cursor-grabbing">
            <MemberCard
              member={activeDragMember}
              projectId={activeDragContext?.project.id ?? 'pool'}
              projectName={activeDragContext?.project.name ?? 'Organization Pool'}
              teamId={activeDragContext?.team.id ?? 'pool'}
              teamName={activeDragContext?.team.name ?? 'Available'}
              requirements={activeDragContext?.team.requirements ?? []}
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
