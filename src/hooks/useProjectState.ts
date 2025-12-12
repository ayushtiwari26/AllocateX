import { useState, useCallback } from 'react';
import { Project, Team, TeamMember } from '@/types/allocation';
import { mockProjects } from '@/data/mockData';

export function useProjectState() {
    const [projects, setProjects] = useState<Project[]>(mockProjects);

    const addProject = useCallback((name: string, requirements: { role: string; count: number }[] = []) => {
        const newProject: Project = {
            id: `proj-${Date.now()}`,
            name,
            teams: [
                {
                    id: `team-${Date.now()}`,
                    name: 'Core Team',
                    projectId: `proj-${Date.now()}`,
                    members: []
                }
            ],
            requirements
        };
        setProjects((prev) => [...prev, newProject]);
    }, []);

    const addTeam = useCallback((projectId: string, name: string) => {
        setProjects((prev) =>
            prev.map((p) => {
                if (p.id === projectId) {
                    return {
                        ...p,
                        teams: [
                            ...p.teams,
                            {
                                id: `team-${Date.now()}`,
                                name,
                                projectId,
                                members: [],
                            },
                        ],
                    };
                }
                return p;
            })
        );
    }, []);

    const addMember = useCallback((teamId: string, memberData: Omit<TeamMember, 'id' | 'teamId'>) => {
        const newMemberId = `member-${Date.now()}`;
        const newMember: TeamMember = { ...memberData, id: newMemberId, teamId };

        setProjects((prev) => {
            return prev.map((p) => {
                const teamIndex = p.teams.findIndex(t => t.id === teamId);
                if (teamIndex >= 0) {
                    // This project contains the team
                    let newRequirements = p.requirements ? [...p.requirements] : [];
                    const roleReqIndex = newRequirements.findIndex(r => r.role === memberData.role);

                    if (roleReqIndex >= 0) {
                        const currentCount = p.teams.reduce((acc, team) =>
                            acc + team.members.filter(m => m.role === memberData.role).length, 0
                        );
                        if (currentCount >= newRequirements[roleReqIndex].count) {
                            newRequirements[roleReqIndex] = {
                                ...newRequirements[roleReqIndex],
                                count: currentCount + 1
                            };
                        }
                    } else {
                        newRequirements.push({ role: memberData.role, count: 1 });
                    }

                    return {
                        ...p,
                        requirements: newRequirements,
                        teams: p.teams.map(t => t.id === teamId ? { ...t, members: [...t.members, newMember] } : t)
                    };
                }
                return p;
            });
        });
    }, []);

    const moveMember = useCallback((memberId: string, sourceTeamId: string, targetTeamId: string) => {
        setProjects((prev) => {
            // Find member to identify role
            let memberToMove: TeamMember | undefined;
            for (const p of prev) {
                for (const t of p.teams) {
                    if (t.id === sourceTeamId) {
                        memberToMove = t.members.find(m => m.id === memberId);
                        if (memberToMove) break;
                    }
                }
                if (memberToMove) break;
            }

            if (!memberToMove) return prev;

            return prev.map(p => {
                // Check if target team is in this project
                const isTargetInProject = p.teams.some(t => t.id === targetTeamId);
                const wasInProject = p.teams.some(t => t.id === sourceTeamId);

                if (isTargetInProject && !wasInProject) {
                    // Moving INTO this project from outside
                    let newRequirements = p.requirements ? [...p.requirements] : [];
                    const roleReqIndex = newRequirements.findIndex(r => r.role === memberToMove!.role);

                    if (roleReqIndex >= 0) {
                        const currentCount = p.teams.reduce((acc, team) =>
                            acc + team.members.filter(m => m.role === memberToMove!.role).length, 0
                        );
                        if (currentCount >= newRequirements[roleReqIndex].count) {
                            newRequirements[roleReqIndex].count = currentCount + 1;
                        }
                    } else {
                        newRequirements.push({ role: memberToMove!.role, count: 1 });
                    }

                    return {
                        ...p,
                        requirements: newRequirements,
                        teams: p.teams.map(t => {
                            if (t.id === targetTeamId) return { ...t, members: [...t.members, { ...memberToMove!, teamId: targetTeamId }] };
                            return t;
                        })
                    };
                }

                // Standard move or removal
                return {
                    ...p,
                    teams: p.teams.map(t => {
                        if (t.id === sourceTeamId) {
                            return { ...t, members: t.members.filter(m => m.id !== memberId) };
                        }
                        if (t.id === targetTeamId) {
                            return { ...t, members: [...t.members, { ...memberToMove!, teamId: targetTeamId }] };
                        }
                        return t;
                    })
                };
            });
        });
    }, []);

    const editProject = useCallback((projectId: string, updates: Partial<Project>) => {
        setProjects((prev) =>
            prev.map((p) => (p.id === projectId ? { ...p, ...updates } : p))
        );
    }, []);

    const deleteProject = useCallback((projectId: string) => {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
    }, []);

    const editMember = useCallback((memberId: string, updates: Partial<TeamMember>) => {
        setProjects((prev) =>
            prev.map((project) => ({
                ...project,
                teams: project.teams.map((team) => ({
                    ...team,
                    members: team.members.map((member) =>
                        member.id === memberId ? { ...member, ...updates } : member
                    ),
                })),
            }))
        );
    }, []);

    const deleteMember = useCallback((memberId: string) => {
        setProjects((prev) =>
            prev.map((project) => ({
                ...project,
                teams: project.teams.map((team) => ({
                    ...team,
                    members: team.members.filter((member) => member.id !== memberId),
                })),
            }))
        );
    }, []);

    return {
        projects,
        addProject,
        addTeam,
        addMember,
        moveMember,
        editProject,
        deleteProject,
        editMember,
        deleteMember,
    };
}
