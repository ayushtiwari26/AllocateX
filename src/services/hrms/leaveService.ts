/**
 * Mock Leave Service
 * Handles leave requests, approvals, and calendar management
 */

import { LeaveRequest, LeaveBalance, LeaveType, LeaveStatus, EmployeeAvailability, CalendarEvent } from '@/types/hrms';

const LEAVE_REQUESTS_KEY = 'allocx_leave_requests';
const LEAVE_BALANCE_KEY = 'allocx_leave_balance';
const CALENDAR_EVENTS_KEY = 'allocx_calendar_events';
const AVAILABILITY_KEY = 'allocx_employee_availability';

// Default leave entitlements per year
const DEFAULT_PAID_LEAVE = 12;
const DEFAULT_SICK_LEAVE = 12;
const DEFAULT_CASUAL_LEAVE = 12;

export const leaveService = {
    /**
     * Apply for leave/WFH/On Duty
     */
    requestLeave(leaveData: {
        employeeId: string;
        employeeName: string;
        leaveType: LeaveType;
        startDate: string;
        endDate: string;
        halfDayDate?: string;
        reason: string;
    }): LeaveRequest {
        console.log('[Leave] Creating new leave request:', leaveData);

        const currentUser = JSON.parse(localStorage.getItem('allocx_current_user') || '{}');

        // Calculate total days
        const start = new Date(leaveData.startDate);
        const end = new Date(leaveData.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        let totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        // If half day, adjust
        if (leaveData.halfDayDate) {
            totalDays = 0.5;
        }

        const leaveRequest: LeaveRequest = {
            id: `leave-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            employeeId: leaveData.employeeId,
            employeeName: leaveData.employeeName,
            organisationId: currentUser.organisationId || 'org-demo-1',
            leaveType: leaveData.leaveType,
            startDate: leaveData.startDate,
            endDate: leaveData.endDate,
            halfDayDate: leaveData.halfDayDate,
            totalDays,
            reason: leaveData.reason,
            status: 'Pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Save request
        const requests = JSON.parse(localStorage.getItem(LEAVE_REQUESTS_KEY) || '[]');
        requests.push(leaveRequest);
        localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(requests));

        console.log('[Leave] Request created:', leaveRequest.id);
        return leaveRequest;
    },

    /**
     * Approve leave request
     */
    approveLeave(leaveId: string, approverId: string): LeaveRequest {
        console.log('[Leave] Approving:', leaveId);

        const requests: LeaveRequest[] = JSON.parse(localStorage.getItem(LEAVE_REQUESTS_KEY) || '[]');
        const request = requests.find(r => r.id === leaveId);

        if (!request) {
            throw new Error('Leave request not found');
        }

        if (request.status !== 'Pending') {
            throw new Error(`Cannot approve request with status: ${request.status}`);
        }

        // Update request
        request.status = 'Approved';
        request.approvedBy = approverId;
        request.approvedAt = new Date().toISOString();
        request.updatedAt = new Date().toISOString();

        localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(requests));

        // Update employee availability
        this.updateAvailability(request);

        // Deduct from leave balance if Paid Leave
        if (request.leaveType === 'Paid Leave') {
            this.deductLeaveBalance(request.employeeId, request.totalDays, new Date().getFullYear());
        }

        console.log('[Leave] Approved:', leaveId);
        return request;
    },

    /**
     * Reject leave request
     */
    rejectLeave(leaveId: string, rejectionReason: string): LeaveRequest {
        console.log('[Leave] Rejecting:', leaveId);

        const requests: LeaveRequest[] = JSON.parse(localStorage.getItem(LEAVE_REQUESTS_KEY) || '[]');
        const request = requests.find(r => r.id === leaveId);

        if (!request) {
            throw new Error('Leave request not found');
        }

        request.status = 'Rejected';
        request.rejectionReason = rejectionReason;
        request.updatedAt = new Date().toISOString();

        localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(requests));

        console.log('[Leave] Rejected:', leaveId);
        return request;
    },

    /**
     * Update employee availability based on approved leave
     */
    updateAvailability(leaveRequest: LeaveRequest): void {
        const availability: EmployeeAvailability[] = JSON.parse(localStorage.getItem(AVAILABILITY_KEY) || '[]');

        const start = new Date(leaveRequest.startDate);
        const end = new Date(leaveRequest.endDate);

        // Create availability records for each day
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const dateStr = date.toISOString().split('T')[0];

            // Remove existing availability for this date
            const filtered = availability.filter(a =>
                !(a.employeeId === leaveRequest.employeeId && a.date === dateStr)
            );

            // Add new availability
            let status: 'On Leave' | 'WFH' | 'On Duty' = 'On Leave';
            if (leaveRequest.leaveType === 'Work From Home') status = 'WFH';
            if (leaveRequest.leaveType === 'On Duty') status = 'On Duty';

            filtered.push({
                id: `avail-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                employeeId: leaveRequest.employeeId,
                date: dateStr,
                availabilityStatus: status,
                leaveRequestId: leaveRequest.id,
                updatedAt: new Date().toISOString()
            });

            localStorage.setItem(AVAILABILITY_KEY, JSON.stringify(filtered));
        }
    },

    /**
     * Get leave requests for employee
     */
    getLeaveRequests(employeeId: string): LeaveRequest[] {
        const requests: LeaveRequest[] = JSON.parse(localStorage.getItem(LEAVE_REQUESTS_KEY) || '[]');
        return requests
            .filter(r => r.employeeId === employeeId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    /**
     * Get pending leave requests (for PM/CTO approval)
     */
    getPendingRequests(organisationId: string): LeaveRequest[] {
        const requests: LeaveRequest[] = JSON.parse(localStorage.getItem(LEAVE_REQUESTS_KEY) || '[]');
        return requests
            .filter(r => r.organisationId === organisationId && r.status === 'Pending')
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    },

    /**
     * Get leave balance for employee
     */
    getLeaveBalance(employeeId: string, year: number = new Date().getFullYear()): LeaveBalance {
        const balances: LeaveBalance[] = JSON.parse(localStorage.getItem(LEAVE_BALANCE_KEY) || '[]');
        let balance = balances.find(b => b.employeeId === employeeId && b.year === year);

        if (!balance) {
            // Initialize balance
            balance = {
                employeeId,
                year,
                paidLeaveTotal: DEFAULT_PAID_LEAVE,
                paidLeaveUsed: 0,
                paidLeaveRemaining: DEFAULT_PAID_LEAVE,
                sickLeaveTotal: DEFAULT_SICK_LEAVE,
                sickLeaveUsed: 0,
                casualLeaveTotal: DEFAULT_CASUAL_LEAVE,
                casualLeaveUsed: 0,
                compensatoryOffBalance: 0
            };

            balances.push(balance);
            localStorage.setItem(LEAVE_BALANCE_KEY, JSON.stringify(balances));
        }

        return balance;
    },

    /**
     * Deduct leave from balance
     */
    deductLeaveBalance(employeeId: string, days: number, year: number): void {
        const balances: LeaveBalance[] = JSON.parse(localStorage.getItem(LEAVE_BALANCE_KEY) || '[]');
        let balance = balances.find(b => b.employeeId === employeeId && b.year === year);

        if (!balance) {
            balance = this.getLeaveBalance(employeeId, year);
            balances.push(balance);
        }

        balance.paidLeaveUsed += days;
        balance.paidLeaveRemaining = balance.paidLeaveTotal - balance.paidLeaveUsed;

        localStorage.setItem(LEAVE_BALANCE_KEY, JSON.stringify(balances));
    },

    /**
     * Get employee availability for a date range
     */
    getAvailability(employeeId: string, startDate: string, endDate: string): EmployeeAvailability[] {
        const availability: EmployeeAvailability[] = JSON.parse(localStorage.getItem(AVAILABILITY_KEY) || '[]');

        return availability.filter(a =>
            a.employeeId === employeeId &&
            a.date >= startDate &&
            a.date <= endDate
        ).sort((a, b) => a.date.localeCompare(b.date));
    },

    /**
     * Get calendar events (holidays, etc.)
     */
    getCalendarEvents(organisationId: string, startDate: string, endDate: string): CalendarEvent[] {
        const events: CalendarEvent[] = JSON.parse(localStorage.getItem(CALENDAR_EVENTS_KEY) || '[]');

        return events.filter(e =>
            e.organisationId === organisationId &&
            e.startDate >= startDate &&
            e.endDate <= endDate
        );
    },

    /**
     * Add holiday/company event
     */
    addEvent(eventData: Omit<CalendarEvent, 'id' | 'createdAt'>): CalendarEvent {
        const event: CalendarEvent = {
            ...eventData,
            id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString()
        };

        const events = JSON.parse(localStorage.getItem(CALENDAR_EVENTS_KEY) || '[]');
        events.push(event);
        localStorage.setItem(CALENDAR_EVENTS_KEY, JSON.stringify(events));

        return event;
    },

    /**
     * Check if employee is available on a date
     */
    isAvailable(employeeId: string, date: string): boolean {
        const availability = this.getAvailability(employeeId, date, date);

        if (availability.length === 0) return true;

        const status = availability[0].availabilityStatus;
        return status === 'Available' || status === 'WFH' || status === 'On Duty';
    },

    /**
     * Get upcoming leaves for team
     */
    getUpcomingLeaves(organisationId: string, days: number = 7): LeaveRequest[] {
        const requests: LeaveRequest[] = JSON.parse(localStorage.getItem(LEAVE_REQUESTS_KEY) || '[]');
        const today = new Date().toISOString().split('T')[0];
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        const futureDateStr = futureDate.toISOString().split('T')[0];

        return requests.filter(r =>
            r.organisationId === organisationId &&
            r.status === 'Approved' &&
            r.startDate >= today &&
            r.startDate <= futureDateStr
        ).sort((a, b) => a.startDate.localeCompare(b.startDate));
    }
};
