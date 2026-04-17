/**
 * Attendance Tab for Employee Profile
 * Shows geofenced clock in/out and attendance history
 */

import GeofencedClockInOut from '@/components/hrms/attendance/GeofencedClockInOut';
import AttendanceLog from '@/components/hrms/attendance/AttendanceLog';

export default function AttendanceTab() {
    return (
        <div className="space-y-6">
            <GeofencedClockInOut />
            <AttendanceLog />
        </div>
    );
}
