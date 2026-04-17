/**
 * Keka-driven seeder. Wipes dummy employees/users/teams/projects and rehydrates
 * the database from Keka (live or snapshot). Creates:
 *   - Users with role derived from job title
 *   - Employees with department / designation / manager
 *   - Sub-team memberships (Software Engineering, QA, DevOps, etc.)
 *   - A "GembaConnect IT" umbrella project with Keka sub-teams so ProjectList
 *     reflects the same structure as Keka.
 */

import { User, Employee, Project, Team, TeamMember } from '../models';
import kekaService, { KekaEmployee } from '../services/kekaService';
import gitlabService from '../services/gitlabService';

const normalizeDesignation = (t: string) => t.trim();

export interface SeedResult {
    employeesCreated: number;
    teamsCreated: number;
    gitlabProjectsCreated: number;
    teamLeads: string[];
}

export async function seedFromKeka(opts: { wipeExisting?: boolean } = {}): Promise<SeedResult> {
    const wipe = opts.wipeExisting !== false;

    if (wipe) {
        // Truncate in dependency-safe order.
        await TeamMember.destroy({ where: {}, truncate: true, cascade: true, force: true });
        await Team.destroy({ where: {}, truncate: true, cascade: true, force: true });
        await Project.destroy({ where: {}, truncate: true, cascade: true, force: true });
        await Employee.destroy({ where: {}, truncate: true, cascade: true, force: true });
        await User.destroy({ where: {}, truncate: true, cascade: true, force: true });
    }

    const keka = await kekaService.fetchAllEmployees();
    console.log(`📥 Pulled ${keka.length} employees from Keka (${kekaService.isLiveConfigured() ? 'live' : 'snapshot'})`);

    // 1. Users + Employees
    const employeeByKekaId = new Map<number, any>();

    for (const k of keka) {
        const role = kekaService.deriveRole(k.jobtitle);
        const { firstName, lastName } = kekaService.splitName(k.displayName);

        const user = await User.create({
            firebaseUid: `keka-${k.id}`,
            email: k.email,
            displayName: k.displayName,
            photoURL: k.profileImageUrl,
            role,
            isActive: true,
        });

        const designation = normalizeDesignation(k.jobtitle);
        const employee = await Employee.create({
            userId: user.id,
            employeeCode: k.employeeNumber,
            firstName,
            lastName: lastName || firstName,
            email: k.email,
            phone: k.mobilePhone || k.workPhone || null,
            dateOfJoining: new Date('2023-01-01'),
            designation,
            department: k.department || 'IT',
            currentWorkload: 20,
            maxCapacity: 40,
            velocity: 3,
            availability: 'available',
            isActive: true,
        });
        employeeByKekaId.set(k.id, employee);
    }
    console.log(`✓ Created ${employeeByKekaId.size} users + employees`);

    // 2. Group by sub-team, pick a lead
    const subTeams = new Map<string, KekaEmployee[]>();
    for (const k of keka) {
        const t = kekaService.deriveTeam(k.jobtitle);
        if (!subTeams.has(t)) subTeams.set(t, []);
        subTeams.get(t)!.push(k);
    }

    // Pick an admin (first "Tech Consultant" => manager) to own the project
    const adminCandidate = keka.find(k => kekaService.deriveRole(k.jobtitle) === 'manager')
        ?? keka.find(k => kekaService.deriveRole(k.jobtitle) === 'team_lead')
        ?? keka[0];
    const adminEmployee = employeeByKekaId.get(adminCandidate.id);

    // Promote admin-candidate user to admin role so the app bootstraps cleanly
    await User.update({ role: 'admin' }, { where: { id: adminEmployee.userId } });

    // 3. Umbrella project that mirrors Keka IT department
    const umbrella = await Project.create({
        name: 'GembaConnect — IT Department',
        description: 'Umbrella project mirroring the Keka IT department structure (synced from Keka).',
        status: 'active',
        priority: 'high',
        startDate: new Date('2024-01-01'),
        managerId: adminEmployee.id,
    });

    // 4. Teams + memberships
    const teamLeads: string[] = [];
    let teamsCreated = 0;
    for (const [teamName, members] of subTeams.entries()) {
        // Prefer Tech Lead > Senior > first
        const leadKeka = members.find(m => /tech lead|team lead/i.test(m.jobtitle))
            ?? members.find(m => /senior/i.test(m.jobtitle))
            ?? members[0];
        const leadEmployee = employeeByKekaId.get(leadKeka.id);

        const team = await Team.create({
            projectId: umbrella.id,
            name: teamName,
            description: `${teamName} team (auto-synced from Keka IT department).`,
            leadId: leadEmployee.id,
        });
        teamsCreated++;
        teamLeads.push(`${teamName}: ${leadKeka.displayName}`);

        // Promote lead user role if still "employee"
        await User.update({ role: 'team_lead' }, { where: { id: leadEmployee.userId, role: 'employee' } });

        // Set reporting manager for non-leads in this team
        const nonLeadIds = members.filter(m => m.id !== leadKeka.id).map(m => employeeByKekaId.get(m.id).id);
        if (nonLeadIds.length) {
            await Employee.update(
                { reportingManagerId: leadEmployee.id },
                { where: { id: nonLeadIds } }
            );
        }

        // Add all team members as project team members
        for (const m of members) {
            const emp = employeeByKekaId.get(m.id);
            await TeamMember.create({
                teamId: team.id,
                employeeId: emp.id,
                role: m.jobtitle,
                allocationPercentage: m.id === leadKeka.id ? 60 : 80,
                joinedAt: new Date('2024-01-01'),
                isActive: true,
            });
        }
    }
    console.log(`✓ Created ${teamsCreated} teams with leads`);

    // 5. GitLab projects → AllocateX projects (so ProjectList shows them)
    let gitlabProjectsCreated = 0;
    try {
        const { projects: glProjects } = await gitlabService.listProjects({ perPage: 50 });
        for (const gp of glProjects) {
            await Project.create({
                name: gp.name_with_namespace || gp.name,
                description: gp.description || `${gp.path_with_namespace} · imported from GitLab`,
                status: 'active',
                priority: 'medium',
                startDate: new Date('2024-01-01'),
                managerId: adminEmployee.id,
                gitlabProjectId: gp.id,
                gitlabProjectPath: gp.path_with_namespace,
                gitlabWebUrl: gp.web_url,
            });
            gitlabProjectsCreated++;
        }
        console.log(`✓ Imported ${gitlabProjectsCreated} GitLab projects`);
    } catch (err) {
        console.warn('⚠ GitLab import skipped:', (err as Error).message);
    }

    return {
        employeesCreated: employeeByKekaId.size,
        teamsCreated,
        gitlabProjectsCreated,
        teamLeads,
    };
}
