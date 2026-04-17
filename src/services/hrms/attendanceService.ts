/**
 * Mock Attendance Service
 * Handles clock-in/out, geofencing, and attendance tracking
 */

import { AttendanceLog, GeolocationLog, AttendanceMetrics, GeofenceValidation, GeoCoordinates, AttendanceStatus } from '@/types/hrms';

const ATTENDANCE_STORAGE_KEY = 'allocx_attendance_logs';
const GEOLOCATION_STORAGE_KEY = 'allocx_geolocation_logs';

// Default office location (can be configured per organization)
const DEFAULT_OFFICE_LOCATION: GeoCoordinates = {
    latitude: 19.0760, // Mumbai
    longitude: 72.8777,
    accuracy: 10
};

const GEOFENCE_RADIUS_METERS = 100;
const WORK_START_TIME = '09:30';
const LATE_THRESHOLD_MINUTES = 15;
const HALF_DAY_HOURS = 4;

export const attendanceService = {
    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    calculateDistance(coord1: GeoCoordinates, coord2: GeoCoordinates): number {
        const R = 6371e3; // Earth radius in meters
        const φ1 = (coord1.latitude * Math.PI) / 180;
        const φ2 = (coord2.latitude * Math.PI) / 180;
        const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
        const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    },

    /**
     * Validate if location is within geofence
     */
    validateGeofence(
        employeeLocation: GeoCoordinates,
        officeLocation: GeoCoordinates = DEFAULT_OFFICE_LOCATION,
        radiusMeters: number = GEOFENCE_RADIUS_METERS
    ): GeofenceValidation {
        const distance = this.calculateDistance(employeeLocation, officeLocation);
        const isValid = distance <= radiusMeters;

        return {
            isValid,
            distance: Math.round(distance),
            accuracy: employeeLocation.accuracy || 0,
            timestamp: new Date().toISOString(),
            withinRadius: isValid,
            location: employeeLocation
        };
    },

    /**
     * Clock In
     */
    clockIn(
        employeeId: string,
        location: GeoCoordinates,
        deviceId: string = 'web-browser'
    ): { success: boolean; log: AttendanceLog; geofenceValidation: GeofenceValidation } {
        console.log('[Attendance] Clock In:', employeeId);

        // Validate geofence
        const geofenceValidation = this.validateGeofence(location);

        // Create geolocation log
        const geoLog: GeolocationLog = {
            id: `geo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            employeeId,
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy || 0,
            actionType: 'clock_in',
            timestamp: new Date().toISOString(),
            isWithinGeofence: geofenceValidation.isValid,
            geofenceRadiusMeters: GEOFENCE_RADIUS_METERS,
            distanceFromOffice: geofenceValidation.distance,
            deviceId,
            createdAt: new Date().toISOString()
        };

        // Save geolocation log
        const geoLogs = JSON.parse(localStorage.getItem(GEOLOCATION_STORAGE_KEY) || '[]');
        geoLogs.push(geoLog);
        localStorage.setItem(GEOLOCATION_STORAGE_KEY, JSON.stringify(geoLogs));

        // Determine attendance status
        const clockInTime = new Date();
        const status = this.deriveAttendanceStatus(clockInTime, null, geofenceValidation.isValid);

        // Create attendance log
        const currentUser = JSON.parse(localStorage.getItem('allocx_current_user') || '{}');
        const attendanceLog: AttendanceLog = {
            id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            employeeId,
            organisationId: currentUser.organisationId || 'org-demo-1',
            clockInTime: clockInTime.toISOString(),
            status,
            deviceId,
            clockInLocationId: geoLog.id,
            isGeofenceValid: geofenceValidation.isValid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Save attendance log
        const logs = JSON.parse(localStorage.getItem(ATTENDANCE_STORAGE_KEY) || '[]');
        logs.push(attendanceLog);
        localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(logs));

        console.log('[Attendance] Clock In Success:', status);

        return { success: true, log: attendanceLog, geofenceValidation };
    },

    /**
     * Clock Out
     */
    clockOut(
        employeeId: string,
        location: GeoCoordinates,
        deviceId: string = 'web-browser'
    ): { success: boolean; log: AttendanceLog; workHours: number } {
        console.log('[Attendance] Clock Out:', employeeId);

        // Find today's attendance log
        const logs: AttendanceLog[] = JSON.parse(localStorage.getItem(ATTENDANCE_STORAGE_KEY) || '[]');
        const today = new Date().toISOString().split('T')[0];
        const todayLog = logs.find(log =>
            log.employeeId === employeeId &&
            log.clockInTime.startsWith(today) &&
            !log.clockOutTime
        );

        if (!todayLog) {
            throw new Error('No clock-in record found for today');
        }

        // Validate geofence for clock out
        const geofenceValidation = this.validateGeofence(location);

        // Create geolocation log for clock out
        const geoLog: GeolocationLog = {
            id: `geo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            employeeId,
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy || 0,
            actionType: 'clock_out',
            timestamp: new Date().toISOString(),
            isWithinGeofence: geofenceValidation.isValid,
            geofenceRadiusMeters: GEOFENCE_RADIUS_METERS,
            distanceFromOffice: geofenceValidation.distance,
            deviceId,
            createdAt: new Date().toISOString()
        };

        const geoLogs = JSON.parse(localStorage.getItem(GEOLOCATION_STORAGE_KEY) || '[]');
        geoLogs.push(geoLog);
        localStorage.setItem(GEOLOCATION_STORAGE_KEY, JSON.stringify(geoLogs));

        // Calculate work hours
        const clockOutTime = new Date();
        const clockInTime = new Date(todayLog.clockInTime);
        const workHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

        // Update status based on work hours
        let finalStatus = todayLog.status;
        if (workHours < HALF_DAY_HOURS) {
            finalStatus = 'Half Day';
        } else if (workHours >= 8) {
            finalStatus = todayLog.status === 'Late' ? 'Late' : 'Present';
        }

        // Update attendance log
        todayLog.clockOutTime = clockOutTime.toISOString();
        todayLog.clockOutLocationId = geoLog.id;
        todayLog.workHours = Math.round(workHours * 100) / 100;
        todayLog.status = finalStatus;
        todayLog.updatedAt = new Date().toISOString();

        // Save updated logs
        localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(logs));

        console.log('[Attendance] Clock Out Success:', finalStatus, workHours);

        return { success: true, log: todayLog, workHours: todayLog.workHours };
    },

    /**
     * Derive attendance status
     */
    deriveAttendanceStatus(
        clockInTime: Date,
        clockOutTime: Date | null,
        isGeofenceValid: boolean
    ): AttendanceStatus {
        if (!isGeofenceValid) {
            return 'No Attendance';
        }

        // Parse expected start time
        const [hours, minutes] = WORK_START_TIME.split(':').map(Number);
        const expectedStart = new Date(clockInTime);
        expectedStart.setHours(hours, minutes, 0, 0);

        // Check if late
        const lateThreshold = new Date(expectedStart.getTime() + LATE_THRESHOLD_MINUTES * 60000);
        if (clockInTime > lateThreshold) {
            return 'Late';
        }

        // If clock out time available, check for half day
        if (clockOutTime) {
            const workHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
            if (workHours < HALF_DAY_HOURS) {
                return 'Half Day';
            }
        }

        return 'Present';
    },

    /**
     * Get attendance logs for employee
     */
    getAttendanceLogs(employeeId: string, month?: string): AttendanceLog[] {
        const logs: AttendanceLog[] = JSON.parse(localStorage.getItem(ATTENDANCE_STORAGE_KEY) || '[]');
        let filtered = logs.filter(log => log.employeeId === employeeId);

        if (month) {
            filtered = filtered.filter(log => log.clockInTime.startsWith(month));
        }

        return filtered.sort((a, b) =>
            new Date(b.clockInTime).getTime() - new Date(a.clockInTime).getTime()
        );
    },

    /**
     * Get today's attendance status
     */
    getTodayAttendance(employeeId: string): AttendanceLog | null {
        const today = new Date().toISOString().split('T')[0];
        const logs = this.getAttendanceLogs(employeeId, today);
        return logs.length > 0 ? logs[0] : null;
    },

    /**
     * Calculate attendance metrics
     */
    calculateMetrics(employeeId: string, month: string): AttendanceMetrics {
        const logs = this.getAttendanceLogs(employeeId, month);

        const totalDays = logs.length;
        const presentDays = logs.filter(l => l.status === 'Present').length;
        const lateDays = logs.filter(l => l.status === 'Late').length;
        const halfDays = logs.filter(l => l.status === 'Half Day').length;
        const absentDays = logs.filter(l => l.status === 'Absent').length;
        const noAttendanceDays = logs.filter(l => l.status === 'No Attendance').length;

        const attendancePercentage = totalDays > 0
            ? Math.round(((presentDays + lateDays + halfDays * 0.5) / totalDays) * 100)
            : 0;

        const punctualityScore = totalDays > 0
            ? Math.round(((presentDays + halfDays) / totalDays) * 100)
            : 0;

        const avgWorkHours = logs.filter(l => l.workHours).length > 0
            ? logs.reduce((sum, l) => sum + (l.workHours || 0), 0) / logs.filter(l => l.workHours).length
            : 0;

        return {
            totalDays,
            presentDays,
            lateDays,
            halfDays,
            absentDays,
            weeklyOffs: 0,
            holidays: 0,
            attendancePercentage,
            punctualityScore,
            averageWorkHours: Math.round(avgWorkHours * 100) / 100
        };
    },

    /**
     * Check if employee can clock in
     */
    canClockIn(employeeId: string): { canClockIn: boolean; reason?: string } {
        const todayLog = this.getTodayAttendance(employeeId);

        if (todayLog && !todayLog.clockOutTime) {
            return { canClockIn: false, reason: 'Already clocked in today' };
        }

        if (todayLog && todayLog.clockOutTime) {
            return { canClockIn: false, reason: 'Already completed attendance for today' };
        }

        return { canClockIn: true };
    },

    /**
     * Check if employee can clock out
     */
    canClockOut(employeeId: string): { canClockOut: boolean; reason?: string } {
        const todayLog = this.getTodayAttendance(employeeId);

        if (!todayLog) {
            return { canClockOut: false, reason: 'No clock-in record for today' };
        }

        if (todayLog.clockOutTime) {
            return { canClockOut: false, reason: 'Already clocked out today' };
        }

        return { canClockOut: true };
    }
};
