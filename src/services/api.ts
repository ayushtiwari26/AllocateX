import axios, { AxiosError } from 'axios';
import { Capacitor } from '@capacitor/core';

// API Configuration - Handle different environments
const getApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  
  // On native Android, localhost refers to the device itself, not the host machine
  // Use 10.0.2.2 for Android emulator or configure your actual server IP
  if (Capacitor.isNativePlatform()) {
    const platform = Capacitor.getPlatform();
    if (platform === 'android') {
      // Replace localhost with Android emulator's host IP
      // For real devices, you'll need to use your computer's actual IP address
      return configuredUrl.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
    }
  }
  
  return configuredUrl;
};

const API_BASE_URL = getApiBaseUrl();
console.log('AllocX API URL:', API_BASE_URL);

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout for mobile networks
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('allocx_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('API Error Details:', {
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('allocx_auth_token');
      localStorage.removeItem('allocx_user_session');
      localStorage.removeItem('allocx_org_session');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

// Types
export interface EmployeeSkillRecord {
  id: string;
  employeeId: string;
  skillName: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience: number;
}

export interface EmployeeTeamMembershipRecord {
  id: string;
  teamId: string;
  employeeId: string;
  role: string;
  allocationPercentage: number;
  joinedAt: string;
  leftAt?: string;
  isActive: boolean;
  team?: {
    id: string;
    projectId: string;
    name: string;
    description?: string;
    project?: {
      id: string;
      name: string;
      description?: string;
      status: 'active' | 'on-hold' | 'completed' | 'cancelled';
      priority: 'low' | 'medium' | 'high' | 'critical';
      startDate: string;
      endDate?: string;
    };
  };
}

export interface Employee {
  id: string;
  userId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfJoining: string;
  designation: string;
  department: string;
  reportingManagerId: string | null;
  currentWorkload: number;
  maxCapacity: number;
  velocity: number;
  availability: 'available' | 'partially-available' | 'unavailable';
  isActive: boolean;
  skills?: EmployeeSkillRecord[];
  teamMemberships?: EmployeeTeamMembershipRecord[];
  leaveBalance?: LeaveBalance;
  finance?: EmployeeFinance;
  reportingManager?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'on-hold' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  managerId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requirements?: ProjectRequirement[];
  teams?: ProjectTeamRecord[];
}

export interface ProjectRequirement {
  role: string;
  count: number;
}

export interface ProjectTeamRecord {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  leadId?: string;
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
    designation: string;
  };
  members?: ProjectTeamMemberRecord[];
  requirements?: ProjectRequirement[];
}

export interface ProjectTeamMemberRecord {
  id: string;
  teamId: string;
  employeeId: string;
  role: string;
  allocationPercentage: number;
  joinedAt: string;
  leftAt?: string;
  isActive: boolean;
  employee?: Employee;
}

export interface RoleCandidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  designation: string;
  department: string;
  availability: Employee['availability'];
  currentWorkload: number;
  maxCapacity: number;
  velocity: number;
  skills: EmployeeSkillRecord[];
  matchedSkills: string[];
  matchScore: number;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  clockInTime?: string;
  clockOutTime?: string;
  status: 'present' | 'absent' | 'half-day' | 'leave' | 'wfh' | 'on-duty';
  totalHours?: number;
  remarks?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approverId?: string;
  approverRemarks?: string;
  approvedAt?: string;
  totalDays: number;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  year: number;
  casualLeave: number;
  sickLeave: number;
  earnedLeave: number;
  unpaidLeave: number;
}

export interface EmployeeFinance {
  id: string;
  employeeId: string;
  salaryMode: 'monthly' | 'biweekly' | 'weekly';
  baseSalary: number;
  currency: string;
  paymentMethod: 'bank-transfer' | 'cheque' | 'cash';
  ctcAmount?: number;
  hra?: number;
  da?: number;
  allowances?: number;
  pfNumber?: string;
  uanNumber?: string;
  pfStatus: 'active' | 'inactive' | 'not-applicable';
  panNumber?: string;
  aadhaarNumber?: string;
}

// API Service Methods

// Authentication
export const authApi = {
  login: async (data: { firebaseUid?: string; email?: string }) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, data);
    return response.data;
  },
  register: async (userData: any) => {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
};

// Employees
export const employeeApi = {
  getAll: async (): Promise<Employee[]> => {
    const response = await apiClient.get('/employees');
    return response.data?.employees ?? response.data;
  },
  getById: async (id: string): Promise<Employee> => {
    const response = await apiClient.get(`/employees/${id}`);
    return response.data?.employee ?? response.data;
  },
  create: async (data: Partial<Employee>): Promise<Employee> => {
    const response = await apiClient.post('/employees', data);
    return response.data;
  },
  update: async (id: string, data: Partial<Employee>): Promise<Employee> => {
    const response = await apiClient.put(`/employees/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/employees/${id}`);
  },
  getSkills: async (id: string) => {
    const response = await apiClient.get(`/employees/${id}/skills`);
    return response.data;
  },
};

// Projects
export const projectApi = {
  getAll: async (): Promise<Project[]> => {
    const response = await apiClient.get('/projects');
    const rawProjects = response.data?.projects ?? response.data;
    return Array.isArray(rawProjects) ? rawProjects.map(normalizeProject) : [];
  },
  getById: async (id: string): Promise<Project> => {
    const response = await apiClient.get(`/projects/${id}`);
    return normalizeProject(response.data?.project ?? response.data);
  },
  create: async (data: Partial<Project> & { defaultTeamName?: string; defaultTeamDescription?: string }): Promise<Project> => {
    const response = await apiClient.post('/projects', {
      ...data,
      requirements: data.requirements,
    });
    return normalizeProject(response.data?.project ?? response.data);
  },
  update: async (id: string, data: Partial<Project>): Promise<Project> => {
    const response = await apiClient.put(`/projects/${id}`, {
      ...data,
      requirements: data.requirements,
    });
    return normalizeProject(response.data?.project ?? response.data);
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },
  getTeams: async (id: string): Promise<ProjectTeamRecord[]> => {
    const response = await apiClient.get(`/projects/${id}/teams`);
    return response.data?.teams ?? response.data;
  },
  addTeam: async (
    projectId: string,
    data: { name: string; description?: string; leadId?: string }
  ): Promise<ProjectTeamRecord> => {
    const response = await apiClient.post(`/projects/${projectId}/teams`, data);
    return response.data?.team ?? response.data;
  },
  addMember: async (
    projectId: string,
    teamId: string,
    data: { employeeId: string; role: string; allocationPercentage?: number }
  ): Promise<ProjectTeamMemberRecord> => {
    const response = await apiClient.post(`/projects/${projectId}/teams/${teamId}/members`, data);
    return response.data?.member ?? response.data;
  },
  updateMember: async (
    projectId: string,
    teamId: string,
    memberId: string,
    data: { role?: string; allocationPercentage?: number; targetTeamId?: string }
  ): Promise<ProjectTeamMemberRecord> => {
    const response = await apiClient.patch(`/projects/${projectId}/teams/${teamId}/members/${memberId}`, data);
    return response.data?.member ?? response.data;
  },
  removeMember: async (projectId: string, teamId: string, memberId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/teams/${teamId}/members/${memberId}`);
  },
  getRoleCandidates: async (
    projectId: string,
    role: string,
    params?: { availability?: Employee['availability']; limit?: number }
  ): Promise<RoleCandidate[]> => {
    const response = await apiClient.get(`/projects/${projectId}/roles/${encodeURIComponent(role)}/candidates`, {
      params,
    });
    return response.data?.candidates ?? [];
  },
};

// Teams
export const teamApi = {
  getById: async (id: string): Promise<ProjectTeamRecord> => {
    const response = await apiClient.get(`/teams/${id}`);
    return response.data;
  },
  create: async (data: Partial<ProjectTeamRecord>): Promise<ProjectTeamRecord> => {
    const response = await apiClient.post('/teams', data);
    return response.data;
  },
  update: async (id: string, data: Partial<ProjectTeamRecord>): Promise<ProjectTeamRecord> => {
    const response = await apiClient.put(`/teams/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/teams/${id}`);
  },
  getMembers: async (id: string): Promise<ProjectTeamMemberRecord[]> => {
    const response = await apiClient.get(`/teams/${id}/members`);
    return response.data;
  },
  addMember: async (teamId: string, data: Partial<ProjectTeamMemberRecord>): Promise<ProjectTeamMemberRecord> => {
    const response = await apiClient.post(`/teams/${teamId}/members`, data);
    return response.data;
  },
  removeMember: async (teamId: string, memberId: string): Promise<void> => {
    await apiClient.delete(`/teams/${teamId}/members/${memberId}`);
  },
};

// Attendance
export const attendanceApi = {
  getByEmployee: async (employeeId: string, startDate?: string, endDate?: string): Promise<Attendance[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await apiClient.get(`/attendance/employee/${employeeId}?${params}`);
    return response.data;
  },
  clockIn: async (data: { employeeId: string; latitude?: number; longitude?: number; accuracy?: number; isWithinGeofence?: boolean; distanceFromOffice?: number; location?: { latitude: number; longitude: number; accuracy?: number } }): Promise<Attendance> => {
    // API expects flat structure: { employeeId, latitude, longitude }
    const payload: any = { employeeId: data.employeeId };
    const lat = data.latitude ?? data.location?.latitude;
    const lng = data.longitude ?? data.location?.longitude;
    const acc = data.accuracy ?? data.location?.accuracy;
    if (lat !== undefined) payload.latitude = lat;
    if (lng !== undefined) payload.longitude = lng;
    if (acc !== undefined) payload.accuracy = acc;
    if (data.isWithinGeofence !== undefined) payload.isWithinGeofence = data.isWithinGeofence;
    if (data.distanceFromOffice !== undefined) payload.distanceFromOffice = data.distanceFromOffice;
    const response = await apiClient.post('/attendance/clock-in', payload);
    return response.data?.attendance ?? response.data;
  },
  clockOut: async (attendanceId: string, data: { employeeId?: string; latitude?: number; longitude?: number; accuracy?: number; location?: { latitude: number; longitude: number; accuracy?: number } }): Promise<Attendance> => {
    // API expects flat structure: { employeeId, latitude, longitude }
    const payload: any = {};
    if (data.employeeId) payload.employeeId = data.employeeId;
    const lat = data.latitude ?? data.location?.latitude;
    const lng = data.longitude ?? data.location?.longitude;
    const acc = data.accuracy ?? data.location?.accuracy;
    if (lat !== undefined) payload.latitude = lat;
    if (lng !== undefined) payload.longitude = lng;
    if (acc !== undefined) payload.accuracy = acc;
    const response = await apiClient.post(`/attendance/${attendanceId}/clock-out`, payload);
    return response.data?.attendance ?? response.data;
  },
  markLeave: async (data: { employeeId: string; date: string; remarks?: string }): Promise<Attendance> => {
    const response = await apiClient.post('/attendance/mark-leave', data);
    return response.data;
  },
};

// Leave Management
export const leaveApi = {
  getByEmployee: async (employeeId: string): Promise<LeaveRequest[]> => {
    const response = await apiClient.get(`/leave/employee/${employeeId}`);
    return response.data;
  },
  getPending: async (): Promise<LeaveRequest[]> => {
    const response = await apiClient.get('/leave/pending');
    return response.data;
  },
  create: async (data: Partial<LeaveRequest>): Promise<LeaveRequest> => {
    const response = await apiClient.post('/leave', data);
    return response.data;
  },
  approve: async (id: string, remarks?: string): Promise<LeaveRequest> => {
    const response = await apiClient.post(`/leave/${id}/approve`, { remarks });
    return response.data;
  },
  reject: async (id: string, remarks: string): Promise<LeaveRequest> => {
    const response = await apiClient.post(`/leave/${id}/reject`, { remarks });
    return response.data;
  },
  cancel: async (id: string): Promise<LeaveRequest> => {
    const response = await apiClient.post(`/leave/${id}/cancel`);
    return response.data;
  },
  getBalance: async (employeeId: string, year?: number): Promise<LeaveBalance> => {
    const params = year ? `?year=${year}` : '';
    const response = await apiClient.get(`/leave/balance/${employeeId}${params}`);
    return response.data;
  },
};

// Finance
export const financeApi = {
  getByEmployee: async (employeeId: string): Promise<EmployeeFinance> => {
    const response = await apiClient.get(`/finance/employee/${employeeId}`);
    return response.data;
  },
  update: async (employeeId: string, data: Partial<EmployeeFinance>): Promise<EmployeeFinance> => {
    const response = await apiClient.put(`/finance/employee/${employeeId}`, data);
    return response.data;
  },
  getBankDetails: async (employeeId: string) => {
    const response = await apiClient.get(`/finance/employee/${employeeId}/bank-details`);
    return response.data;
  },
};

// AI Allocation
export const allocationApi = {
  generateAllocation: async (data: {
    projectId: string;
    requirements: string;
    employees: Employee[];
    teamSize?: number;
  }) => {
    const response = await apiClient.post('/allocation/generate', data);
    return response.data;
  },
  getRecommendations: async (projectId: string) => {
    const response = await apiClient.get(`/allocation/recommendations/${projectId}`);
    return response.data;
  },
};

export default apiClient;

function parseRequirements(raw: unknown): ProjectRequirement[] | undefined {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as ProjectRequirement[];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as ProjectRequirement[]) : [];
    } catch (error) {
      console.warn('Failed to parse project requirements:', error);
      return [];
    }
  }
  return [];
}

function normalizeProject(raw: any): Project {
  if (!raw) {
    return {
      id: '',
      name: '',
      description: '',
      status: 'active',
      startDate: new Date().toISOString(),
      managerId: '',
      priority: 'medium',
      requirements: [],
      teams: [],
    };
  }

  return {
    ...raw,
    requirements: parseRequirements(raw.requirements),
    teams: raw.teams ?? [],
  };
}
