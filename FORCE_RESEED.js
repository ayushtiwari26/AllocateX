/**
 * Force reseed script - Clear and regenerate all employee profile data
 * 
 * To use:
 * 1. Open browser console (F12)
 * 2. Copy and paste this entire script
 * 3. Press Enter
 */

console.log('🔄 Starting force reseed...');

// Step 1: Clear existing profiles
localStorage.removeItem('allocx_employee_profiles');
console.log('✅ Cleared existing profiles');

// Step 2: Get current user and organization
const currentUserStr = localStorage.getItem('allocx_current_user');
if (!currentUserStr) {
    console.error('❌ No current user found. Please sign in first.');
    throw new Error('No current user');
}

const currentUser = JSON.parse(currentUserStr);
console.log('✅ Current user:', currentUser.email, 'Org:', currentUser.organisationId);

// Step 3: Get employees and projects
const employeesStr = localStorage.getItem('allocx_employees');
const projectsStr = localStorage.getItem('allocx_projects');

if (!employeesStr || !projectsStr) {
    console.error('❌ No employees or projects found');
    throw new Error('Missing base data');
}

const allEmployees = JSON.parse(employeesStr);
const allProjects = JSON.parse(projectsStr);

console.log(`✅ Found ${allEmployees.length} total employees, ${allProjects.length} total projects`);

// Step 4: Filter by organization
const employees = allEmployees.filter(e => e.organisationId === currentUser.organisationId);
const projects = allProjects.filter(p => p.organisationId === currentUser.organisationId);

console.log(`✅ Your org has ${employees.length} employees and ${projects.length} projects`);

// Step 5: Create profiles
const profiles = [];
let totalAllocations = 0;
let totalTasks = 0;

employees.forEach((employee, index) => {
    // Role-based project assignment
    const isLead = employee.role === 'Team Lead' || employee.role === 'Project Manager';
    const isSenior = employee.role.includes('Senior') || employee.role.includes('Lead');

    const numberOfProjects = isLead ? Math.min(3, projects.length) : isSenior ? Math.min(2, projects.length) : Math.min(1, projects.length);
    const assignedProjects = projects.slice(0, numberOfProjects);

    // Create allocations
    const allocations = assignedProjects.map((project, projIdx) => {
        const isPrimary = projIdx === 0;
        const allocationPercentage = isPrimary ? (isLead ? 50 : 70) : (isLead ? 30 : 20);
        const hoursAllocated = Math.round((allocationPercentage / 100) * 40);

        // Create tasks
        const taskCount = Math.floor(Math.random() * 4) + 2;
        const tasks = Array.from({ length: taskCount }, (_, taskIdx) => {
            const statuses = ['todo', 'in-progress', 'review', 'done'];
            const priorities = ['low', 'medium', 'high', 'critical'];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const storyPoints = Math.floor(Math.random() * 10) + 1;

            return {
                id: `task-${employee.id}-${project.id}-${taskIdx}`,
                title: `Task ${taskIdx + 1} for ${project.name}`,
                description: `Work on ${project.name}`,
                status,
                priority: priorities[Math.floor(Math.random() * priorities.length)],
                storyPoints,
                estimatedHours: storyPoints * 2,
                actualHours: status === 'done' ? storyPoints * 2 : undefined,
                assignedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            };
        });

        totalTasks += tasks.length;

        return {
            projectId: project.id,
            projectName: project.name,
            roleInProject: isLead ? 'Technical Lead' : employee.role,
            allocationPercentage,
            startDate: project.startDate || new Date().toISOString(),
            endDate: project.deadline,
            isActive: project.status === 'active',
            hoursAllocated,
            currentSprintTasks: tasks
        };
    });

    totalAllocations += allocations.length;

    // Calculate workload
    const totalWorkload = allocations.reduce((sum, a) => sum + a.hoursAllocated, 0);
    const utilization = (totalWorkload / 40) * 100;
    const availability = utilization >= 90 ? 'overloaded' : utilization >= 60 ? 'busy' : 'available';

    // Create skills
    const skills = (employee.skills || []).map(skillName => ({
        name: skillName,
        category: 'Other',
        proficiency: isSenior ? 'Advanced' : 'Intermediate',
        yearsOfExperience: Math.floor(Math.random() * 5) + 2
    }));

    // Create profile
    const profile = {
        id: employee.id,
        fullName: employee.name,
        email: employee.email,
        phone: employee.phone || `+1-555-${String(1000 + index).padStart(4, '0')}`,
        location: 'Remote',
        avatar: employee.avatar,
        role: employee.role,
        department: employee.department || 'Engineering',
        employeeId: employee.id,
        joinDate: employee.joiningDate || new Date().toISOString(),
        skills,
        yearsOfExperience: isSenior ? 5 : 3,
        pastProjects: [],
        strongAreas: (employee.skills || []).slice(0, 3),
        techStack: employee.skills || [],
        certifications: [],
        currentWorkload: totalWorkload,
        maxCapacity: 40,
        velocity: Math.round((6 + Math.random() * 4) * 10) / 10,
        availability,
        allocatedProjects: allocations,
        completedTasks: Math.floor(Math.random() * 50) + 20,
        ongoingTasks: allocations.reduce((sum, a) => sum + a.currentSprintTasks.filter(t => t.status === 'in-progress').length, 0),
        averageTaskCompletionTime: Math.round((2 + Math.random() * 3) * 10) / 10,
        qualityScore: Math.floor(75 + Math.random() * 20),
        collaborationScore: Math.floor(70 + Math.random() * 25),
        organisationId: employee.organisationId,
        teamId: employee.teamId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    profiles.push(profile);
});

// Step 6: Save
localStorage.setItem('allocx_employee_profiles', JSON.stringify(profiles));

console.log('✅ Created profiles:');
console.log(`   📊 Total Profiles: ${profiles.length}`);
console.log(`   📁 Total Project Allocations: ${totalAllocations}`);
console.log(`   ✅ Total Sprint Tasks: ${totalTasks}`);
console.log(`   🟢 Available: ${profiles.filter(p => p.availability === 'available').length}`);
console.log(`   🟡 Busy: ${profiles.filter(p => p.availability === 'busy').length}`);
console.log(`   🔴 Overloaded: ${profiles.filter(p => p.availability === 'overloaded').length}`);

console.log('\n🎉 RESEED COMPLETE! Reload the page to see the data.');
console.log('Navigate to /dashboard/employees and click any employee to see their profile with allocated projects!');
