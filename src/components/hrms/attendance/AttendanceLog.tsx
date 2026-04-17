/**
 * Attendance Log Component
 * Displays attendance history in a table format
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { attendanceService } from '@/services/hrms/attendanceService';
import { useAuth } from '@/context/AuthContext';
import { Calendar, CheckCircle2, XCircle, AlertCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AttendanceLog, AttendanceMetrics } from '@/types/hrms';

export default function AttendanceLogComponent() {
    const { user } = useAuth();
    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [metrics, setMetrics] = useState<AttendanceMetrics | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string>(
        new Date().toISOString().substring(0, 7)
    );

    useEffect(() => {
        if (user?.id) {
            loadAttendance();
        }
    }, [user, selectedMonth]);

    const loadAttendance = () => {
        if (!user?.id) return;

        const attendanceLogs = attendanceService.getAttendanceLogs(user.id, selectedMonth);
        const attendanceMetrics = attendanceService.calculateMetrics(user.id, selectedMonth);

        setLogs(attendanceLogs);
        setMetrics(attendanceMetrics);
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            'Present': 'bg-green-100 text-green-700 border-green-300',
            'Late': 'bg-orange-100 text-orange-700 border-orange-300',
            'Half Day': 'bg-yellow-100 text-yellow-700 border-yellow-300',
            'Absent': 'bg-gray-100 text-gray-700 border-gray-300',
            'No Attendance': 'bg-red-100 text-red-700 border-red-300'
        };

        const icons = {
            'Present': <CheckCircle2 className="w-3 h-3" />,
            'Late': <AlertCircle className="w-3 h-3" />,
            'Half Day': <Clock className="w-3 h-3" />,
            'Absent': <XCircle className="w-3 h-3" />,
            'No Attendance': <XCircle className="w-3 h-3" />
        };

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || styles.Absent}`}>
                {icons[status as keyof typeof icons]}
                {status}
            </span>
        );
    };

    const formatTime = (isoString: string | undefined) => {
        if (!isoString) return '-';
        return new Date(isoString).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            weekday: 'short'
        });
    };

    const changeMonth = (direction: 'prev' | 'next') => {
        const date = new Date(selectedMonth + '-01');
        if (direction === 'prev') {
            date.setMonth(date.getMonth() - 1);
        } else {
            date.setMonth(date.getMonth() + 1);
        }
        setSelectedMonth(date.toISOString().substring(0, 7));
    };

    const getMonthName = (monthStr: string) => {
        const date = new Date(monthStr + '-01');
        return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    };

    return (
        <div className="space-y-6">
            {/* Metrics Summary */}
            {metrics && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-green-600">{metrics.presentDays}</p>
                                <p className="text-sm text-gray-600 mt-1">Present</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-orange-600">{metrics.lateDays}</p>
                                <p className="text-sm text-gray-600 mt-1">Late</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-yellow-600">{metrics.halfDays}</p>
                                <p className="text-sm text-gray-600 mt-1">Half Day</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-indigo-600">{metrics.attendancePercentage}%</p>
                                <p className="text-sm text-gray-600 mt-1">Attendance</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-purple-600">{metrics.averageWorkHours}h</p>
                                <p className="text-sm text-gray-600 mt-1">Avg Hours</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Attendance Log Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Attendance History
                        </CardTitle>

                        {/* Month Navigator */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => changeMonth('prev')}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-sm font-medium px-3">
                                {getMonthName(selectedMonth)}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => changeMonth('next')}
                                disabled={selectedMonth >= new Date().toISOString().substring(0, 7)}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {logs.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p>No attendance records for this month</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2">
                                        <th className="text-left p-3 font-semibold text-gray-700">Date</th>
                                        <th className="text-left p-3 font-semibold text-gray-700">Clock In</th>
                                        <th className="text-left p-3 font-semibold text-gray-700">Clock Out</th>
                                        <th className="text-center p-3 font-semibold text-gray-700">Hours</th>
                                        <th className="text-center p-3 font-semibold text-gray-700">Status</th>
                                        <th className="text-center p-3 font-semibold text-gray-700">Location</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr key={log.id} className="border-b hover:bg-gray-50">
                                            <td className="p-3">
                                                <div className="font-medium">{formatDate(log.clockInTime)}</div>
                                            </td>
                                            <td className="p-3">
                                                <div className="text-sm">{formatTime(log.clockInTime)}</div>
                                            </td>
                                            <td className="p-3">
                                                <div className="text-sm">{formatTime(log.clockOutTime)}</div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="text-sm font-medium">
                                                    {log.workHours ? `${log.workHours}h` : '-'}
                                                </div>
                                            </td>
                                            <td className="p-3 text-center">
                                                {getStatusBadge(log.status)}
                                            </td>
                                            <td className="p-3 text-center">
                                                {log.isGeofenceValid ? (
                                                    <span className="text-green-600 text-sm">✓ Valid</span>
                                                ) : (
                                                    <span className="text-red-600 text-sm">✗ Invalid</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
