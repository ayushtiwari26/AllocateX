/**
 * Complete HRMS Type Definitions
 * Includes Attendance, Leave, Financial, Statutory, and Geofencing types
 */

// ==================== ATTENDANCE & GEOFENCING ====================

export type AttendanceStatus =
    | 'Present'
    | 'Late'
    | 'Half Day'
    | 'Absent'
    | 'No Attendance'
    | 'Weekend'
    | 'Holiday';

export interface GeoCoordinates {
    latitude: number;
    longitude: number;
    accuracy?: number;
}

export interface GeolocationLog {
    id: string;
    employeeId: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
    actionType: 'clock_in' | 'clock_out';
    timestamp: string;
    isWithinGeofence: boolean;
    geofenceRadiusMeters: number;
    distanceFromOffice: number;
    deviceId: string;
    ipAddress?: string;
    createdAt: string;
}

export interface GeofenceSettings {
    id: string;
    organisationId: string;
    officeName: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
    isActive: boolean;
    createdAt: string;
}

export interface AttendanceLog {
    id: string;
    employeeId: string;
    organisationId: string;
    clockInTime: string;
    clockOutTime?: string;
    status: AttendanceStatus;
    workHours?: number;
    deviceId: string;
    clockInLocationId: string;
    clockOutLocationId?: string;
    isGeofenceValid: boolean;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AttendanceMetrics {
    totalDays: number;
    presentDays: number;
    lateDays: number;
    halfDays: number;
    absentDays: number;
    weeklyOffs: number;
    holidays: number;
    attendancePercentage: number;
    punctualityScore: number;
    averageWorkHours: number;
}

export interface GeofenceValidation {
    isValid: boolean;
    distance: number;
    accuracy: number;
    timestamp: string;
    withinRadius: boolean;
    location: GeoCoordinates;
}

// ==================== LEAVE & CALENDAR ====================

export type LeaveType =
    | 'Paid Leave'
    | 'Unpaid Leave'
    | 'Work From Home'
    | 'On Duty'
    | 'Sick Leave'
    | 'Casual Leave'
    | 'Compensatory Off';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export type AvailabilityStatus =
    | 'Available'
    | 'On Leave'
    | 'WFH'
    | 'On Duty'
    | 'Weekend'
    | 'Holiday'
    | 'Not Available';

export interface LeaveRequest {
    id: string;
    employeeId: string;
    organisationId: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    totalDays: number;
    halfDayDate?: string; // If half day
    reason: string;
    status: LeaveStatus;
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;
    createdAt: string;
    updatedAt: string;
    // Extended fields
    employeeName?: string;
    projectImpact?: ProjectImpact[];
}

export interface ProjectImpact {
    projectId: string;
    projectName: string;
    criticalTasks: string[];
    impactLevel: 'Low' | 'Medium' | 'High' | 'Critical';
    suggestedReplacements: string[];
}

export interface CalendarEvent {
    id: string;
    organisationId: string;
    eventType: 'Holiday' | 'Weekly Off' | 'Company Event';
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    isWorkingDay: boolean;
    createdAt: string;
}

export interface EmployeeAvailability {
    id: string;
    employeeId: string;
    date: string;
    availabilityStatus: AvailabilityStatus;
    leaveRequestId?: string;
    updatedAt: string;
}

export interface LeaveBalance {
    employeeId: string;
    year: number;
    paidLeaveTotal: number;
    paidLeaveUsed: number;
    paidLeaveRemaining: number;
    sickLeaveTotal: number;
    sickLeaveUsed: number;
    casualLeaveTotal: number;
    casualLeaveUsed: number;
    compensatoryOffBalance: number;
}

export interface CalendarDay {
    date: string;
    isWeekend: boolean;
    isHoliday: boolean;
    holidayName?: string;
    leaves: LeaveRequest[];
    availability: AvailabilityStatus;
    workingHours?: number;
}

// ==================== FINANCIAL & STATUTORY ====================

export type SalaryMode = 'Monthly' | 'Weekly' | 'Hourly' | 'Project-based';
export type PaymentMethod = 'Bank Transfer' | 'Cash' | 'Cheque' | 'UPI';
export type PFStatus = 'Applicable' | 'Not Applicable' | 'Pending' | 'Opted Out';
export type ESIEligibility = 'Eligible' | 'Not Eligible' | 'Pending';
export type DocumentType =
    | 'PAN'
    | 'Aadhaar'
    | 'Address Proof'
    | 'Photo ID'
    | 'Resume'
    | 'Education Certificate'
    | 'Experience Letter';

export interface EmployeeFinancials {
    id: string;
    employeeId: string;
    salaryMode: SalaryMode;
    paymentMethod: PaymentMethod;
    baseSalary: number;
    currency: string;
    ctc: number;
    hra?: number;
    da?: number;
    specialAllowance?: number;
    variablePay?: number;
    createdAt: string;
    updatedAt: string;
}

export interface EmployeeBankDetails {
    id: string;
    employeeId: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    branchName: string;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface EmployeePFDetails {
    id: string;
    employeeId: string;
    pfStatus: PFStatus;
    pfNumber?: string;
    uanNumber?: string;
    pfJoinDate?: string;
    isActive: boolean;
    employeeContribution?: number;
    employerContribution?: number;
    createdAt: string;
    updatedAt: string;
}

export interface EmployeeESIDetails {
    id: string;
    employeeId: string;
    esiEligibility: ESIEligibility;
    esiNumber?: string;
    isActive: boolean;
    employeeContribution?: number;
    employerContribution?: number;
    createdAt: string;
    updatedAt: string;
}

export interface EmployeePTDetails {
    id: string;
    employeeId: string;
    state: string;
    registeredLocation: string;
    ptNumber?: string;
    isApplicable: boolean;
    monthlyDeduction?: number;
    createdAt: string;
    updatedAt: string;
}

export interface EmployeeIdentityDoc {
    id: string;
    employeeId: string;
    documentType: DocumentType;
    documentNumber: string;
    documentUrl: string;
    isVerified: boolean;
    uploadedAt: string;
    verifiedAt?: string;
    verifiedBy?: string;
    expiryDate?: string;
    notes?: string;
}

export interface DocumentValidation {
    documentType: DocumentType;
    isUploaded: boolean;
    isVerified: boolean;
    isMandatory: boolean;
    validationStatus: 'Valid' | 'Invalid' | 'Pending' | 'Missing';
    errorMessage?: string;
}

// ==================== AI INTEGRATION ====================

export interface AIAllocationContext {
    employee: {
        id: string;
        name: string;
        availability: AttendanceMetrics;
        upcomingLeave: LeaveRequest[];
        attendanceRisk: AttendanceRiskScore;
        currentWorkload: number;
        skills: string[];
    };
    project: {
        id: string;
        name: string;
        timeline: { start: string; end: string };
        criticalDates: string[];
    };
}

export interface AllocationDecision {
    canAllocate: boolean;
    confidence: number;
    reason: string;
    warnings: string[];
    alternativeSuggestions: ReplacementSuggestion[];
    riskFactors: RiskFactor[];
}

export interface AttendanceRiskScore {
    score: number; // 0-1
    category: 'Low' | 'Medium' | 'High' | 'Critical';
    factors: {
        lateClockIns: number;
        absentDays: number;
        noAttendanceDays: number;
        punctualityTrend: 'Improving' | 'Stable' | 'Declining';
    };
    prediction: string;
}

export interface ReplacementSuggestion {
    employeeId: string;
    employeeName: string;
    matchScore: number;
    availability: AvailabilityStatus;
    skillMatch: number;
    workloadCapacity: number;
    reason: string;
}

export interface RiskFactor {
    type: 'Leave Conflict' | 'Attendance Risk' | 'Workload' | 'Skill Gap';
    severity: 'Low' | 'Medium' | 'High';
    description: string;
    mitigation?: string;
}

export interface LeaveImpactAnalysis {
    leaveRequestId: string;
    affectedProjects: ProjectImpact[];
    teamImpact: {
        teamSize: number;
        othersOnLeave: number;
        availableBackups: number;
    };
    recommendation: 'Approve' | 'Suggest Reschedule' | 'Find Replacement' | 'Reject';
    reasoning: string;
}

// ==================== DASHBOARD & ANALYTICS ====================

export interface AttendanceDashboard {
    organisationId: string;
    date: string;
    totalEmployees: number;
    presentToday: number;
    lateToday: number;
    absentToday: number;
    onLeaveToday: number;
    wfhToday: number;
    attendanceRate: number;
    trends: AttendanceTrend[];
}

export interface AttendanceTrend {
    date: string;
    presentCount: number;
    lateCount: number;
    absentCount: number;
    attendanceRate: number;
}

export interface LeaveDashboard {
    organisationId: string;
    pendingRequests: number;
    approvedThisMonth: number;
    rejectedThisMonth: number;
    upcomingLeaves: LeaveRequest[];
    leaveUtilization: {
        averagePerEmployee: number;
        mostUsedLeaveType: LeaveType;
    };
}

export interface HRMSAlert {
    id: string;
    type: 'Geofence Violation' | 'No Attendance' | 'Leave Conflict' | 'Document Missing';
    severity: 'Info' | 'Warning' | 'Critical';
    employeeId: string;
    message: string;
    timestamp: string;
    isResolved: boolean;
}

// ==================== COMPOSITE TYPES ====================

export interface EmployeeHRMSProfile {
    // Basic Info
    employeeId: string;

    // Attendance
    attendanceLogs: AttendanceLog[];
    attendanceMetrics: AttendanceMetrics;

    // Leave
    leaveRequests: LeaveRequest[];
    leaveBalance: LeaveBalance;
    availability: EmployeeAvailability[];

    // Financial
    financials?: EmployeeFinancials;
    bankDetails?: EmployeeBankDetails;

    // Statutory
    pfDetails?: EmployeePFDetails;
    esiDetails?: EmployeeESIDetails;
    ptDetails?: EmployeePTDetails;

    // Documents
    identityDocs: EmployeeIdentityDoc[];
    documentValidations: DocumentValidation[];

    // AI Insights
    attendanceRisk?: AttendanceRiskScore;
    allocationRecommendations?: AllocationDecision[];
}

export interface HRMSSettings {
    organisationId: string;

    // Attendance Settings
    geofenceEnabled: boolean;
    geofenceRadius: number;
    workingHoursPerDay: number;
    lateThresholdMinutes: number;
    halfDayThresholdHours: number;

    // Leave Settings
    paidLeavePerYear: number;
    sickLeavePerYear: number;
    casualLeavePerYear: number;
    leaveApprovalRequired: boolean;
    maxConsecutiveLeaveDays: number;

    // Financial Settings
    pfApplicable: boolean;
    esiApplicable: boolean;
    ptApplicable: boolean;

    // Notification Settings
    sendAttendanceReminders: boolean;
    sendLeaveApprovalNotifs: boolean;
    sendGeofenceViolationAlerts: boolean;
}
