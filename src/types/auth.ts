export interface Organisation {
    id: string;
    name: string;
    logo?: string;
    adminId?: string;
    createdAt?: string;
    industry?: string;
    size?: string;
}

export interface User {
    id: string;
    email: string;
    displayName: string;
    fullName?: string;
    role: 'admin' | 'employee' | 'manager' | 'team_lead';
    organisationId: string;
    avatar?: string;
    employeeId?: string;
}

export interface AuthResponse {
    user: User;
    token: string;
    organisation: Organisation;
}
