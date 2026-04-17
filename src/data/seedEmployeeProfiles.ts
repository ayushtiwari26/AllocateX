import { EmployeeProfile } from '@/types/employee';

/**
 * Comprehensive employee profile seeding with project allocations
 * This ensures ALL employees have proper project allocations with tasks
 */
export function seedComprehensiveEmployeeData(organisationId: string) {
    console.log('🌱 [SEED] Starting comprehensive employee data seed...');

    // Get existing data
    const allEmployees = JSON.parse(localStorage.getItem('allocx_employees') || '[]');
    const allProjects = JSON.parse(localStorage.getItem('allocx_projects') || '[]');

    // Filter by organization
    const employees = allEmployees.filter((e: any) => e.organisationId === organisationId);
    const projects = allProjects.filter((p: any) => p.organisationId === organisationId);

    console.log(`🌱 [SEED] Found ${employees.length} employees and ${projects.length} projects for org ${organisationId}`);

    if (employees.length === 0) {
        console.error('❌ [SEED] No employees found for organization');
        return [];
    }

    if (projects.length === 0) {
        console.warn('⚠️  [SEED] No projects found - employees will have no allocations');
    }

    // Create profiles with proper allocations
    const profiles: EmployeeProfile[] = employees.map((employee: any, idx: number) => {
        // Role-based project assignment
        const isLead = employee.role === 'Team Lead' || employee.role === 'Project Manager' || employee.role === 'Co-Founder';
        const isSenior = employee.role.includes('Senior') || employee.role.includes('Lead');

        // Assign 1-3 projects per employee
        const numProjects = projects.length > 0
            ? (isLead ? Math.min(3, projects.length) : isSenior ? Math.min(2, projects.length) : Math.min(2, projects.length))
            : 0;

        const assignedProjects = projects.slice(0, numProjects);

        // Create allocations with tasks
        const allocations = assignedProjects.map((project: any, projIdx: number) => {
            const isPrimary = projIdx === 0;
            const allocationPercentage = isPrimary ? (isLead ? 50 : 60) : (isLead ? 30 : 30);
            const hoursAllocated = Math.round((allocationPercentage / 100) * 40);

            // Create 3-5 realistic tasks per project
            const numTasks = Math.floor(Math.random() * 3) + 3; // 3-5 tasks
            const tasks = Array.from({ length: numTasks }, (_, taskIdx) => {
                const statuses = ['todo', 'in-progress', 'review', 'done'] as const;
                const priorities = ['low', 'medium', 'high', 'critical'] as const;
                const statusIndex = Math.floor(Math.random() * statuses.length);
                const status = statuses[statusIndex];
                const storyPoints = Math.floor(Math.random() * 8) + 1;

                const taskTitles = [
                    `Implement ${project.name} feature`,
                    `Code review for ${project.name}`,
                    `Bug fix in ${project.name}`,
                    `Testing ${project.name}`,
                    `Deploy ${project.name}`,
                    `Documentation for ${project.name}`,
                    `Refactor ${project.name} code`,
                    `Optimize ${project.name} performance`
                ];

                return {
                    id: `task-${employee.id}-${project.id}-${taskIdx}`,
                    title: taskTitles[taskIdx % taskTitles.length],
                    description: `Work on ${project.name} - ${employee.role} responsibilities`,
                    status,
                    priority: priorities[Math.floor(Math.random() * priorities.length)],
                    storyPoints,
                    estimatedHours: storyPoints * 2,
                    actualHours: status === 'done' ? Math.floor(storyPoints * 2 * (0.8 + Math.random() * 0.4)) : undefined,
                    assignedDate: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
                    dueDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
                    completedDate: status === 'done' ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined
                };
            });

            return {
                projectId: project.id,
                projectName: project.name,
                roleInProject: isLead ? 'Technical Lead' : employee.role,
                allocationPercentage,
                startDate: project.startDate || new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
                endDate: project.deadline,
                isActive: project.status === 'active',
                hoursAllocated,
                currentSprintTasks: tasks
            };
        });

        // Calculate metrics
        const totalWorkload = allocations.reduce((sum, a) => sum + a.hoursAllocated, 0);
        const utilization = (totalWorkload / 40) * 100;
        const availability = utilization >= 90 ? 'overloaded' : utilization >= 60 ? 'busy' : 'available';

        // Map skills with categories
        const skills = (employee.skills || []).map((skillName: string) => ({
            name: skillName,
            category: 'Other' as any,
            proficiency: (isSenior ? 'Advanced' : 'Intermediate') as any,
            yearsOfExperience: Math.floor(Math.random() * 5) + (isSenior ? 3 : 1)
        }));

        // Create profile
        const profile: EmployeeProfile = {
            id: employee.id,
            fullName: employee.name,
            email: employee.email,
            phone: employee.phone || `+1-555-${String(1000 + idx).padStart(4, '0')}`,
            location: 'Remote',
            avatar: employee.avatar,
            role: employee.role as any,
            department: employee.department || 'Engineering',
            employeeId: employee.id,
            joinDate: employee.joiningDate || new Date().toISOString(),
            skills,
            yearsOfExperience: isSenior ? Math.floor(Math.random() * 5) + 5 : Math.floor(Math.random() * 3) + 2,
            pastProjects: [],
            strongAreas: (employee.skills || []).slice(0, 3),
            techStack: employee.skills || [],
            certifications: [],
            currentWorkload: totalWorkload,
            maxCapacity: 40,
            velocity: Math.round((6 + Math.random() * 4) * 10) / 10,
            availability: availability as any,
            allocatedProjects: allocations,
            completedTasks: Math.floor(Math.random() * 50) + 20,
            ongoingTasks: allocations.reduce((sum, a) =>
                sum + a.currentSprintTasks.filter(t => t.status === 'in-progress').length, 0
            ),
            averageTaskCompletionTime: Math.round((2 + Math.random() * 3) * 10) / 10,
            qualityScore: Math.floor(75 + Math.random() * 20),
            collaborationScore: Math.floor(70 + Math.random() * 25),
            organisationId: employee.organisationId,
            teamId: employee.teamId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        return profile;
    });

    // Save all profiles
    localStorage.setItem('allocx_employee_profiles', JSON.stringify(profiles));

    // Calculate stats
    const totalAllocations = profiles.reduce((sum, p) => sum + p.allocatedProjects.length, 0);
    const totalTasks = profiles.reduce((sum, p) =>
        sum + p.allocatedProjects.reduce((s, a) => s + a.currentSprintTasks.length, 0), 0
    );

    console.log(`✅ [SEED] Created ${profiles.length} employee profiles`);
    console.log(`✅ [SEED] Total project allocations: ${totalAllocations}`);
    console.log(`✅ [SEED] Total sprint tasks: ${totalTasks}`);
    console.log(`✅ [SEED] Availability: ${profiles.filter(p => p.availability === 'available').length} available, ${profiles.filter(p => p.availability === 'busy').length} busy, ${profiles.filter(p => p.availability === 'overloaded').length} overloaded`);

    return profiles;
}

/**
 * Check if seeding is needed and run it
 */
export function autoSeedIfNeeded(organisationId: string): boolean {
    const existing = localStorage.getItem('allocx_employee_profiles');

    if (!existing || JSON.parse(existing).length === 0) {
        console.log('🌱 [AUTO-SEED] No profiles found, running seed...');
        seedComprehensiveEmployeeData(organisationId);
        return true;
    }

    // Check if profiles have allocations
    const profiles = JSON.parse(existing);
    const orgProfiles = profiles.filter((p: any) => p.organisationId === organisationId);
    const hasAllocations = orgProfiles.some((p: any) => p.allocatedProjects && p.allocatedProjects.length > 0);

    if (!hasAllocations) {
        console.log('🌱 [AUTO-SEED] Profiles exist but have no allocations, reseeding...');
        // Remove old profiles for this org
        const otherOrgProfiles = profiles.filter((p: any) => p.organisationId !== organisationId);
        const newProfiles = seedComprehensiveEmployeeData(organisationId);
        localStorage.setItem('allocx_employee_profiles', JSON.stringify([...otherOrgProfiles, ...newProfiles]));
        return true;
    }

    console.log('✓ [AUTO-SEED] Profiles with allocations already exist, skipping seed');
    return false;
}

/**
 * Force reseed (clears and recreates all data)
 */
export function forceReseed(organisationId: string) {
    console.log('🔄 [FORCE-SEED] Force reseeding...');

    // Get all profiles
    const allProfiles = JSON.parse(localStorage.getItem('allocx_employee_profiles') || '[]');

    // Remove profiles for this org
    const otherOrgProfiles = allProfiles.filter((p: any) => p.organisationId !== organisationId);

    // Create new profiles for this org
    const newProfiles = seedComprehensiveEmployeeData(organisationId);

    // Save combined
    localStorage.setItem('allocx_employee_profiles', JSON.stringify([...otherOrgProfiles, ...newProfiles]));

    console.log('✅ [FORCE-SEED] Complete!');
    return newProfiles;
}

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
    (window as any).seedEmployeeData = {
        seed: seedComprehensiveEmployeeData,
        autoSeed: autoSeedIfNeeded,
        forceReseed
    };
    console.log('🛠️  Seed functions available at: window.seedEmployeeData');
}
