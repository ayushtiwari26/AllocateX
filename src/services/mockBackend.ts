
import { Organisation, User, Employee, AuthResponse } from '../types/auth';
import { Project, TeamMember } from '../types/allocation';
import { mockProjects, mockMembers } from '../data/mockData';

const DELAY_MS = 800;

// Helper to simulate network delay
const delay = () => new Promise(resolve => setTimeout(resolve, DELAY_MS));

// LocalStorage Keys
const KEYS = {
    USERS: 'allocx_users',
    ORGS: 'allocx_orgs',
    EMPLOYEES: 'allocx_employees',
    PROJECTS: 'allocx_projects',
    CREDS: 'allocx_creds'
};

const DEMO_ORG_ID_1 = 'org-demo-1';
const DEMO_ORG_ID_2 = 'org-demo-2';

// Initial Data Helper
const get = <T>(key: string): T[] => {
    const data = localStorage.getItem(key);
    if (!data) {
        return seedData(key);
    }
    return JSON.parse(data);
};

const set = (key: string, data: any[]) => {
    localStorage.setItem(key, JSON.stringify(data));
};

const seedData = (key: string): any[] => {
    // Check if we already have data for *any* key to avoid partial seeding, 
    // but for simplicity, we check locally per key request or do a master init.
    // However, since 'get' is per key, let's just return defaults based on the key.

    if (key === KEYS.ORGS) {
        const orgs: Organisation[] = [
            {
                id: DEMO_ORG_ID_1,
                name: 'AllocateX Demo',
                logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=AllocateX',
                adminId: 'user-admin-1',
                createdAt: new Date().toISOString()
            },
            {
                id: DEMO_ORG_ID_2,
                name: 'TechFlow Corp',
                logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=TechFlow',
                adminId: 'user-admin-2',
                createdAt: new Date().toISOString()
            }
        ];
        set(KEYS.ORGS, orgs);
        return orgs;
    }

    if (key === KEYS.USERS) {
        const users: User[] = [
            {
                id: 'user-admin-1',
                email: 'admin@demo.com',
                fullName: 'Demo Admin',
                role: 'admin',
                organisationId: DEMO_ORG_ID_1,
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
            },
            {
                id: 'user-manager-1',
                email: 'manager@demo.com',
                fullName: 'Demo Manager',
                role: 'admin',
                organisationId: DEMO_ORG_ID_1,
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Manager'
            },
            {
                id: 'user-admin-2',
                email: 'admin@techflow.com',
                fullName: 'TechFlow Admin',
                role: 'admin',
                organisationId: DEMO_ORG_ID_2,
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TechAdmin'
            },
            {
                id: 'user-manager-2',
                email: 'manager@techflow.com',
                fullName: 'TechFlow Manager',
                role: 'admin',
                organisationId: DEMO_ORG_ID_2,
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TechManager'
            }
        ];
        set(KEYS.USERS, users);
        // Also seed credentials
        const creds = [
            { email: 'admin@demo.com', password: 'password' },
            { email: 'manager@demo.com', password: 'password' },
            { email: 'admin@techflow.com', password: 'password' },
            { email: 'manager@techflow.com', password: 'password' }
        ];
        set(KEYS.CREDS, creds);
        return users;
    }

    if (key === KEYS.PROJECTS) {
        // Distribute 15 mock projects. First 8 to Org 1, Rest to Org 2.
        const projectsWithOrg = mockProjects.map((p, index) => ({
            ...p,
            organisationId: index < 8 ? DEMO_ORG_ID_1 : DEMO_ORG_ID_2
        }));
        set(KEYS.PROJECTS, projectsWithOrg);
        return projectsWithOrg;
    }

    if (key === KEYS.EMPLOYEES) {
        // Distribute 20 members. First 10 to Org 1, Rest to Org 2.
        const employees: Employee[] = mockMembers.map((m, index) => ({
            id: m.id,
            name: m.name,
            email: `${m.name.toLowerCase().replace(' ', '.')}@${index < 10 ? 'demo.com' : 'techflow.com'}`,
            role: m.role,
            skills: m.skills,
            department: 'Engineering',
            joiningDate: new Date().toISOString(),
            avatar: m.avatar,
            organisationId: index < 10 ? DEMO_ORG_ID_1 : DEMO_ORG_ID_2,
            teamId: m.teamId,
            currentWorkload: m.currentWorkload,
            maxCapacity: m.maxCapacity,
            velocity: m.velocity,
            availability: m.availability as any
        }));
        set(KEYS.EMPLOYEES, employees);
        return employees;
    }

    return [];
};

export const mockBackend = {
    // --- Auth ---
    async signUp(data: any): Promise<AuthResponse> {
        await delay();

        const orgs = get<Organisation>(KEYS.ORGS);
        const users = get<User>(KEYS.USERS);

        if (users.find(u => u.email === data.adminEmail)) {
            throw new Error('User with this email already exists');
        }

        const newOrg: Organisation = {
            id: `org-${Date.now()}`,
            name: data.organisationName,
            logo: data.organisationLogo, // In real app, this would be an uploaded URL
            adminId: '',
            createdAt: new Date().toISOString()
        };

        const newUser: User = {
            id: `user-${Date.now()}`,
            email: data.adminEmail,
            fullName: data.adminName,
            role: 'admin',
            organisationId: newOrg.id,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.adminName}`
        };

        newOrg.adminId = newUser.id;

        set(KEYS.ORGS, [...orgs, newOrg]);
        set(KEYS.USERS, [...users, newUser]);

        // Store password separately/hashed in real app. Here we just assume it's valid if email matches.
        // Ideally we'd store { email, password } in a separate 'credentials' map.
        // For this mock, we skip password verification in signIn or store it in a simplified way.
        const credentials = get<any>('allocx_creds') || [];
        credentials.push({ email: newUser.email, password: data.password });
        set('allocx_creds', credentials);

        return {
            user: newUser,
            token: `fake-jwt-${Date.now()}`,
            organisation: newOrg
        };
    },

    async signIn(email: string, password: string): Promise<AuthResponse> {
        await delay();
        const users = get<User>(KEYS.USERS);
        const orgs = get<Organisation>(KEYS.ORGS);
        const creds = get<any>('allocx_creds') || [];

        const cred = creds.find((c: any) => c.email === email && c.password === password);
        if (!cred) {
            throw new Error('Invalid email or password');
        }

        const user = users.find(u => u.email === email);
        if (!user) throw new Error('User not found');

        const org = orgs.find(o => o.id === user.organisationId);
        if (!org) throw new Error('Organisation data missing');

        return {
            user,
            token: `fake-jwt-${Date.now()}`,
            organisation: org
        };
    },

    // --- Employees ---
    async addMembers(orgId: string, members: any[]): Promise<Employee[]> {
        await delay();
        const allEmployees = get<Employee>(KEYS.EMPLOYEES);

        // Convert input to Employee objects
        const newEmployees: Employee[] = members.map(m => ({
            id: `emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: m.fullName,
            email: m.email,
            role: m.role,
            skills: m.skills || [],
            department: m.department,
            joiningDate: m.joiningDate,
            avatar: m.employeePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.fullName}`,
            organisationId: orgId,
            teamId: '', // Unassigned initially
            currentWorkload: 0,
            maxCapacity: 40,
            velocity: 5,
            availability: 'available'
        }));

        set(KEYS.EMPLOYEES, [...allEmployees, ...newEmployees]);
        return newEmployees;
    },

    async getEmployees(orgId: string): Promise<Employee[]> {
        await delay();
        const all = get<Employee>(KEYS.EMPLOYEES);
        return all.filter(e => e.organisationId === orgId);
    },

    // --- Projects ---
    async createProject(project: Partial<Project> & { organisationId: string }): Promise<Project> {
        await delay();
        const allProjects = get<Project>(KEYS.PROJECTS);

        const newProject: Project = {
            id: `proj-${Date.now()}`,
            name: project.name || 'Untitled Project',
            teams: [],
            ...project
        } as Project;

        set(KEYS.PROJECTS, [...allProjects, newProject]);
        return newProject;
    },

    async getProjects(orgId: string): Promise<Project[]> {
        await delay();
        const all = get<Project>(KEYS.PROJECTS);
        if (!orgId) return all;
        return all.filter(p => p.organisationId === orgId);
    }
};
