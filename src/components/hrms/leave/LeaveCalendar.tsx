/**
 * Leave Calendar Component
 * Color-coded calendar showing leave status
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { leaveService } from '@/services/hrms/leaveService';
import { useAuth } from '@/context/AuthContext';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import type { LeaveRequest, LeaveBalance } from '@/types/hrms';

const LEAVE_COLORS = {
    'Work From Home': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    'On Duty': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
    'Paid Leave': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    'Unpaid Leave': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
    'Sick Leave': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
    'Casual Leave': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
    'Compensatory Off': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' }
};

export default function LeaveCalendar() {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [balance, setBalance] = useState<LeaveBalance | null>(null);

    useEffect(() => {
        if (user?.id) {
            loadLeaveData();
        }
    }, [user, currentDate]);

    const loadLeaveData = () => {
        if (!user?.id) return;

        // Get approved leaves
        const allLeaves = leaveService.getLeaveRequests(user.id);
        const approvedLeaves = allLeaves.filter(l => l.status === 'Approved');
        setLeaves(approvedLeaves);

        // Get leave balance
        const leaveBalance = leaveService.getLeaveBalance(user.id, currentDate.getFullYear());
        setBalance(leaveBalance);
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days: Date[] = [];
        const startPadding = firstDay.getDay(); // 0 = Sunday

        // Add padding days from previous month
        for (let i = startPadding - 1; i >= 0; i--) {
            const paddingDate = new Date(year, month, -i);
            days.push(paddingDate);
        }

        // Add current month days
        for (let day = 1; day <= lastDay.getDate(); day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const getLeaveForDate = (date: Date): LeaveRequest | null => {
        const dateStr = date.toISOString().split('T')[0];
        return leaves.find(leave => {
            const start = leave.startDate;
            const end = leave.endDate;
            return dateStr >= start && dateStr <= end;
        }) || null;
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isCurrentMonth = (date: Date) => {
        return date.getMonth() === currentDate.getMonth();
    };

    const isWeekend = (date: Date) => {
        const day = date.getDay();
        return day === 0 || day === 6; // Sunday or Saturday
    };

    const changeMonth = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        if (direction === 'prev') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }
        setCurrentDate(newDate);
    };

    const days = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-6">
            {/* Leave Balance Summary */}
            {balance && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-green-200 bg-green-50">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-700">{balance.paidLeaveRemaining}</p>
                                <p className="text-sm text-green-600 mt-1">Paid Leave</p>
                                <p className="text-xs text-green-500">of {balance.paidLeaveTotal}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-700">{balance.sickLeaveTotal - balance.sickLeaveUsed}</p>
                                <p className="text-sm text-red-600 mt-1">Sick Leave</p>
                                <p className="text-xs text-red-500">of {balance.sickLeaveTotal}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-yellow-200 bg-yellow-50">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-yellow-700">{balance.casualLeaveTotal - balance.casualLeaveUsed}</p>
                                <p className="text-sm text-yellow-600 mt-1">Casual Leave</p>
                                <p className="text-xs text-yellow-500">of {balance.casualLeaveTotal}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-indigo-200 bg-indigo-50">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-indigo-700">{balance.compensatoryOffBalance}</p>
                                <p className="text-sm text-indigo-600 mt-1">Comp Off</p>
                                <p className="text-xs text-indigo-500">available</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Calendar */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Leave Calendar
                        </CardTitle>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => changeMonth('prev')}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-sm font-medium px-3">{monthName}</span>
                            <Button variant="outline" size="sm" onClick={() => changeMonth('next')}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2">
                        {/* Weekday Headers */}
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center font-semibold text-sm text-gray-600 p-2">
                                {day}
                            </div>
                        ))}

                        {/* Calendar Days */}
                        {days.map((date, index) => {
                            const leave = getLeaveForDate(date);
                            const today = isToday(date);
                            const weekend = isWeekend(date);
                            const currentMonth = isCurrentMonth(date);
                            const colors = leave ? LEAVE_COLORS[leave.leaveType as keyof typeof LEAVE_COLORS] : null;

                            return (
                                <div
                                    key={index}
                                    className={`
                    min-h-[80px] p-2 border rounded-lg
                    ${!currentMonth ? 'bg-gray-50 text-gray-400' : ''}
                    ${weekend && currentMonth ? 'bg-gray-100' : ''}
                    ${today ? 'ring-2 ring-blue-500' : ''}
                    ${leave && currentMonth ? `${colors?.bg} ${colors?.border} border-2` : 'border-gray-200'}
                    ${currentMonth && !leave && !weekend ? 'hover:bg-gray-50' : ''}
                  `}
                                >
                                    <div className="text-right">
                                        <span className={`text-sm font-medium ${today ? 'text-blue-600' : currentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {date.getDate()}
                                        </span>
                                    </div>

                                    {leave && currentMonth && (
                                        <div className={`mt-1 text-xs ${colors?.text} font-medium truncate`}>
                                            {leave.leaveType === 'Work From Home' ? 'WFH' :
                                                leave.leaveType === 'On Duty' ? 'OD' :
                                                    leave.leaveType.split(' ')[0]}
                                        </div>
                                    )}

                                    {weekend && currentMonth && !leave && (
                                        <div className="mt-1 text-xs text-gray-500">
                                            Off
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="mt-6 pt-6 border-t">
                        <p className="text-sm font-semibold mb-3">Legend:</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {Object.entries(LEAVE_COLORS).map(([type, colors]) => (
                                <div key={type} className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded ${colors.bg} ${colors.border} border-2`}></div>
                                    <span className="text-xs">{type}</span>
                                </div>
                            ))}
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-gray-100 border-2 border-gray-300"></div>
                                <span className="text-xs">Weekend</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
