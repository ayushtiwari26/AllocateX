/**
 * Utility functions for testing and debugging employee profile data
 * 
 * Usage in browser console:
 * 1. Import: const utils = await import('./src/utils/profileDebugUtils.ts');
 * 2. Run: utils.resetAndReseed();
 * 3. View: utils.showProfileSummary();
 */

import { seedComprehensiveEmployeeData, getProfileSummary } from '@/data/seedEmployeeProfiles';

/**
 * Clear all employee profiles and reseed with fresh data
 */
export function resetAndReseed() {
    console.log('🔄 Resetting employee profile data...');

    // Clear existing profiles
    localStorage.removeItem('allocx_employee_profiles');

    // Get current user's organization
    const currentUser = JSON.parse(localStorage.getItem('allocx_current_user') || '{}');

    if (!currentUser.organisationId) {
        console.error('❌ No organization found for current user');
        return;
    }

    // Reseed with comprehensive data
    const profiles = seedComprehensiveEmployeeData(currentUser.organisationId);

    console.log('✅ Reset complete! Reload the page to see fresh data.');
    console.log(`📊 Created ${profiles.length} profiles`);

    return profiles;
}

/**
 * Show detailed summary of all profiles
 */
export function showProfileSummary() {
    return getProfileSummary();
}

/**
 * Show employee with most workload
 */
export function findMostBusy() {
    const profiles = JSON.parse(localStorage.getItem('allocx_employee_profiles') || '[]');
    const sorted = profiles.sort((a: any, b: any) => b.currentWorkload - a.currentWorkload);

    console.log('🔥 Most Busy Employees:');
    sorted.slice(0, 5).forEach((p: any, idx: number) => {
        const utilization = Math.round((p.currentWorkload / p.maxCapacity) * 100);
    console.log(`${idx + 1}. ${p.fullName} - ${p.currentWorkload}h/${p.maxCapacity}h (${utilization}%) - ${p.availability}`);
});

return sorted[0];
}

/**
 * Show employee with most projects
 */
export function findMostProjects() {
    const profiles = JSON.parse(localStorage.getItem('allocx_employee_profiles') || '[]');
    const sorted = profiles.sort((a: any, b: any) => b.allocatedProjects.length - a.allocatedProjects.length);

    console.log('📁 Employees with Most Projects:');
    sorted.slice(0, 5).forEach((p: any, idx: number) => {
        console.log(`${idx + 1}. ${p.fullName} - ${p.allocatedProjects.length} projects (${p.role})`);
        p.allocatedProjects.forEach((proj: any) => {
            console.log(`   📌 ${proj.projectName} - ${proj.allocationPercentage}%`);
        });
    });

    return sorted[0];
}

/**
 * Show distribution of employees by availability
 */
export function showAvailabilityDistribution() {
    const profiles = JSON.parse(localStorage.getItem('allocx_employee_profiles') || '[]');

    const distribution = profiles.reduce((acc: any, p: any) => {
        acc[p.availability] = (acc[p.availability] || 0) + 1;
        return acc;
    }, {});

    console.log('📊 Availability Distribution:');
    console.log(`   🟢 Available: ${distribution.available || 0}`);
    console.log(`   🟡 Busy: ${distribution.busy || 0}`);
    console.log(`   🔴 Overloaded: ${distribution.overloaded || 0}`);

    return distribution;
}

/**
 * Verify data consistency
 */
export function verifyDataConsistency() {
    const profiles = JSON.parse(localStorage.getItem('allocx_employee_profiles') || '[]');
    const employees = JSON.parse(localStorage.getItem('allocx_employees') || '[]');
    const projects = JSON.parse(localStorage.getItem('allocx_projects') || '[]');

    console.log('🔍 Data Consistency Check:');
    console.log(`   Employees in mockBackend: ${employees.length}`);
    console.log(`   Employee Profiles: ${profiles.length}`);
    console.log(`   Projects in mockBackend: ${projects.length}`);

    // Check if all employees have profiles
    const missingProfiles = employees.filter((e: any) =>
        !profiles.some((p: any) => p.id === e.id)
    );

    if (missingProfiles.length > 0) {
        console.warn(`   ⚠️  ${missingProfiles.length} employees without profiles`);
        missingProfiles.forEach((e: any) => console.log(`      - ${e.name} (${e.id})`));
    } else {
        console.log(`   ✅ All employees have profiles`);
    }

    // Check project references
    let totalAllocations = 0;
    let invalidProjects = 0;

    profiles.forEach((p: any) => {
        p.allocatedProjects.forEach((alloc: any) => {
            totalAllocations++;
            const projectExists = projects.some((proj: any) => proj.id === alloc.projectId);
            if (!projectExists) {
                invalidProjects++;
                console.warn(`   ⚠️  ${p.fullName} allocated to non-existent project: ${alloc.projectName}`);
            }
        });
    });

    console.log(`   Total Project Allocations: ${totalAllocations}`);
    if (invalidProjects === 0) {
        console.log(`   ✅ All project references valid`);
    } else {
        console.warn(`   ⚠️  ${invalidProjects} invalid project references`);
    }

    return {
        employees: employees.length,
        profiles: profiles.length,
        projects: projects.length,
        missingProfiles: missingProfiles.length,
        totalAllocations,
        invalidProjects
    };
}

/**
 * Show statistics about allocations
 */
export function showAllocationStats() {
    const profiles = JSON.parse(localStorage.getItem('allocx_employee_profiles') || '[]');

    let totalAllocations = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    let totalHours = 0;

    profiles.forEach((p: any) => {
        totalAllocations += p.allocatedProjects.length;
        totalHours += p.currentWorkload;

        p.allocatedProjects.forEach((proj: any) => {
            totalTasks += proj.currentSprintTasks.length;
            completedTasks += proj.currentSprintTasks.filter((t: any) => t.status === 'done').length;
        });
    });

    const avgUtilization = profiles.reduce((sum: number, p: any) =>
        sum + (p.currentWorkload / p.maxCapacity), 0
    ) / profiles.length * 100;

    console.log('📊 Allocation Statistics:');
    console.log(`   Total Employees: ${profiles.length}`);
    console.log(`   Total Project Allocations: ${totalAllocations}`);
    console.log(`   Avg Projects per Employee: ${(totalAllocations / profiles.length).toFixed(1)}`);
    console.log(`   Total Hours Allocated: ${totalHours}h`);
    console.log(`   Avg Workload: ${(totalHours / profiles.length).toFixed(1)}h/week`);
    console.log(`   Avg Utilization: ${avgUtilization.toFixed(1)}%`);
    console.log(`   Total Sprint Tasks: ${totalTasks}`);
    console.log(`   Completed Tasks: ${completedTasks} (${Math.round(completedTasks / totalTasks * 100)}%)`);

    return {
        employees: profiles.length,
        allocations: totalAllocations,
        avgProjects: totalAllocations / profiles.length,
        totalHours,
        avgWorkload: totalHours / profiles.length,
        avgUtilization,
        totalTasks,
        completedTasks
    };
}

// Export all utilities
export const profileDebugUtils = {
    resetAndReseed,
    showProfileSummary,
    findMostBusy,
    findMostProjects,
    showAvailabilityDistribution,
    verifyDataConsistency,
    showAllocationStats
};

// Make available globally in dev mode
if (import.meta.env.DEV) {
    (window as any).profileDebug = profileDebugUtils;
    console.log('🛠️  Profile debug utils available at: window.profileDebug');
}
