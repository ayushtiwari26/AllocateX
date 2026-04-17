import { EmployeeProfile, ProjectAllocation, EmployeeComparison, ProjectImpactAnalysis, ActivityLog } from '@/types/employee';

const STORAGE_KEY = 'allocx_employee_profiles';

export const employeeProfileService = {
    /**
     * Get all employee profiles
     */
    getAllProfiles(organisationId: string): EmployeeProfile[] {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];

        try {
            const profiles = JSON.parse(data);
            return profiles.filter((p: EmployeeProfile) => p.organisationId === organisationId);
        } catch {
            return [];
        }
    },

    /**
     * Get single employee profile
     */
    getProfile(employeeId: string): EmployeeProfile | null {
        const profiles = this.getAllProfiles('');
        return profiles.find(p => p.id === employeeId) || null;
    },

    /**
     * Create new employee profile
     */
    createProfile(profile: Omit<EmployeeProfile, 'id' | 'createdAt' | 'updatedAt'>): EmployeeProfile {
        const profiles = this.getAllProfiles('');

        const newProfile: EmployeeProfile = {
            ...profile,
            id: `emp-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        profiles.push(newProfile);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));

        return newProfile;
    },

    /**
     * Update employee profile
     */
    updateProfile(employeeId: string, updates: Partial<EmployeeProfile>): EmployeeProfile | null {
        const profiles = this.getAllProfiles('');
        const index = profiles.findIndex(p => p.id === employeeId);

        if (index === -1) return null;

        profiles[index] = {
            ...profiles[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
        return profiles[index];
    },

    /**
     * Delete employee profile
     */
    deleteProfile(employeeId: string): boolean {
        const profiles = this.getAllProfiles('');
        const filtered = profiles.filter(p => p.id !== employeeId);

        if (filtered.length === profiles.length) return false;

        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        return true;
    },

    /**
     * Get employee comparisons
     */
    getComparisons(employeeId: string, compareWith?: string[]): EmployeeComparison | null {
        const employee = this.getProfile(employeeId);
        if (!employee) return null;

        const allProfiles = this.getAllProfiles(employee.organisationId);
        const compareProfiles = compareWith
            ? allProfiles.filter(p => compareWith.includes(p.id))
            : allProfiles.filter(p => p.id !== employeeId && (p.teamId === employee.teamId || p.role === employee.role));

        // Build skill comparisons
        const skillComparisons = employee.skills.map(skill => {
            const comparisons = compareProfiles.map(other => {
                const otherSkill = other.skills.find(s => s.name === skill.name);
                const proficiencyLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
                const myLevel = proficiencyLevels.indexOf(skill.proficiency);
                const theirLevel = otherSkill ? proficiencyLevels.indexOf(otherSkill.proficiency) : -1;

                return {
                    employeeId: other.id,
                    employeeName: other.fullName,
                    proficiency: otherSkill?.proficiency || 'N/A',
                    isStronger: theirLevel > myLevel
                };
            });

            return {
                skill: skill.name,
                myProficiency: skill.proficiency,
                comparisons
            };
        });

        // Workload comparison
        const myUtilization = (employee.currentWorkload / employee.maxCapacity) * 100;
        const workloadComparison = {
            myWorkload: employee.currentWorkload,
            myCapacity: employee.maxCapacity,
            myUtilization,
            comparisons: compareProfiles.map(other => ({
                employeeId: other.id,
                employeeName: other.fullName,
                workload: other.currentWorkload,
                capacity: other.maxCapacity,
                utilization: (other.currentWorkload / other.maxCapacity) * 100,
                difference: other.currentWorkload - employee.currentWorkload
            }))
        };

        // Experience comparison
        const experienceComparison = {
            myExperience: employee.yearsOfExperience,
            comparisons: compareProfiles.map(other => ({
                employeeId: other.id,
                employeeName: other.fullName,
                experience: other.yearsOfExperience,
                difference: other.yearsOfExperience - employee.yearsOfExperience
            }))
        };

        // Velocity comparison
        const velocityComparison = {
            myVelocity: employee.velocity,
            comparisons: compareProfiles.map(other => ({
                employeeId: other.id,
                employeeName: other.fullName,
                velocity: other.velocity,
                difference: other.velocity - employee.velocity
            }))
        };

        // Determine utilization status
        let utilizationStatus: 'underutilized' | 'optimal' | 'overloaded';
        if (myUtilization < 70) utilizationStatus = 'underutilized';
        else if (myUtilization <= 90) utilizationStatus = 'optimal';
        else utilizationStatus = 'overloaded';

        return {
            employeeId,
            comparedWith: compareProfiles.map(p => p.id),
            skillComparisons,
            workloadComparison,
            experienceComparison,
            velocityComparison,
            utilizationStatus
        };
    },

    /**
     * Get project impact analysis
     */
    getProjectImpact(employeeId: string, projectId: string): ProjectImpactAnalysis | null {
        const employee = this.getProfile(employeeId);
        if (!employee) return null;

        const allocation = employee.allocatedProjects.find(p => p.projectId === projectId);
        if (!allocation) return null;

        const allProfiles = this.getAllProfiles(employee.organisationId);

        // Calculate impact
        const criticalTasks = allocation.currentSprintTasks.filter(t => t.priority === 'critical' || t.priority === 'high').length;
        const riskScore = Math.min(
            (allocation.allocationPercentage * 0.4) +
            (criticalTasks * 10) +
            (employee.skills.length * 2),
            100
        );

        // Find replacements
        const suggestedReplacements = allProfiles
            .filter(p => p.id !== employeeId)
            .map(candidate => {
                const matchingSkills = employee.skills.filter(skill =>
                    candidate.skills.some(cs => cs.name === skill.name)
                ).map(s => s.name);

                const missingSkills = employee.skills.filter(skill =>
                    !candidate.skills.some(cs => cs.name === skill.name)
                ).map(s => s.name);

                const matchScore = (matchingSkills.length / employee.skills.length) * 100;
                const availableCapacity = candidate.maxCapacity - candidate.currentWorkload;

                let riskOfReplacement: 'low' | 'medium' | 'high';
                if (matchScore > 80 && availableCapacity >= allocation.hoursAllocated) riskOfReplacement = 'low';
                else if (matchScore > 60 && availableCapacity >= allocation.hoursAllocated * 0.7) riskOfReplacement = 'medium';
                else riskOfReplacement = 'high';

                return {
                    employeeId: candidate.id,
                    employeeName: candidate.fullName,
                    matchScore,
                    matchingSkills,
                    missingSkills,
                    currentWorkload: candidate.currentWorkload,
                    availableCapacity,
                    riskOfReplacement,
                    reasoning: `${Math.round(matchScore)}% skill match. ${matchingSkills.length}/${employee.skills.length} skills matched. ${availableCapacity}h capacity available.`
                };
            })
            .filter(r => r.matchScore > 40)
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 5);

        return {
            projectId,
            projectName: allocation.projectName,
            currentRole: allocation.roleInProject,
            impactIfRemoved: {
                timelineImpact: riskScore > 70 ? '2-3 weeks delay' : riskScore > 50 ? '1 week delay' : 'Minimal impact',
                riskScore,
                criticalTasks,
                affectedSprints: Math.ceil(criticalTasks / 5),
                skillGap: employee.skills.filter(s => s.proficiency === 'Expert' || s.proficiency === 'Advanced').map(s => s.name)
            },
            suggestedReplacements
        };
    },

    /**
     * Get activity logs
     */
    getActivityLogs(employeeId: string, limit: number = 20): ActivityLog[] {
        // Mock activity logs
        const employee = this.getProfile(employeeId);
        if (!employee) return [];

        const logs: ActivityLog[] = [
            {
                id: 'log-1',
                employeeId,
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                type: 'task_completed',
                description: 'Completed task "Implement user authentication"',
                metadata: { taskId: 'task-123', storyPoints: 5 }
            },
            {
                id: 'log-2',
                employeeId,
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                type: 'project_assigned',
                description: `Assigned to ${employee.allocatedProjects[0]?.projectName || 'project'}`,
                metadata: { projectId: employee.allocatedProjects[0]?.projectId }
            },
            {
                id: 'log-3',
                employeeId,
                timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                type: 'skill_updated',
                description: 'Added new skill: TypeScript',
                metadata: { skill: 'TypeScript' }
            }
        ];

        return logs.slice(0, limit);
    }
};
