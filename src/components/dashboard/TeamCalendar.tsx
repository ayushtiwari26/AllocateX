/**
 * Team Calendar Component
 * Modern calendar showing employee-wise leave/WFH with color-coded labels
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    ChevronLeft,
    ChevronRight,
    Calendar,
    Home,
    Briefcase,
    Plane,
    Heart,
    Coffee,
    Gift,
    Clock,
    Users
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface LeaveEvent {
    id: string;
    employeeId: string;
    employeeName: string;
    employeeAvatar?: string;
    type: 'wfh' | 'paid-leave' | 'sick-leave' | 'casual-leave' | 'on-duty' | 'compensatory';
    startDate: string;
    endDate: string;
    status: 'approved' | 'pending' | 'rejected';
}

const LEAVE_CONFIG = {
    'wfh': { 
        label: 'Work From Home', 
        short: 'WFH',
        icon: Home, 
        bg: 'bg-blue-100', 
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500'
    },
    'paid-leave': { 
        label: 'Paid Leave', 
        short: 'PL',
        icon: Plane, 
        bg: 'bg-green-100', 
        text: 'text-green-700',
        border: 'border-green-200',
        dot: 'bg-green-500'
    },
    'sick-leave': { 
        label: 'Sick Leave', 
        short: 'SL',
        icon: Heart, 
        bg: 'bg-red-100', 
        text: 'text-red-700',
        border: 'border-red-200',
        dot: 'bg-red-500'
    },
    'casual-leave': { 
        label: 'Casual Leave', 
        short: 'CL',
        icon: Coffee, 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        dot: 'bg-yellow-500'
    },
    'on-duty': { 
        label: 'On Duty', 
        short: 'OD',
        icon: Briefcase, 
        bg: 'bg-purple-100', 
        text: 'text-purple-700',
        border: 'border-purple-200',
        dot: 'bg-purple-500'
    },
    'compensatory': { 
        label: 'Comp Off', 
        short: 'CO',
        icon: Gift, 
        bg: 'bg-indigo-100', 
        text: 'text-indigo-700',
        border: 'border-indigo-200',
        dot: 'bg-indigo-500'
    },
};

// Demo data for the calendar
const DEMO_LEAVES: LeaveEvent[] = [
    // Current week
    { id: '1', employeeId: 'e1', employeeName: 'Priya Sharma', type: 'wfh', startDate: '2025-12-13', endDate: '2025-12-13', status: 'approved' },
    { id: '2', employeeId: 'e2', employeeName: 'Rahul Singh', type: 'paid-leave', startDate: '2025-12-15', endDate: '2025-12-18', status: 'approved' },
    { id: '3', employeeId: 'e3', employeeName: 'Sneha Patel', type: 'wfh', startDate: '2025-12-16', endDate: '2025-12-17', status: 'approved' },
    { id: '4', employeeId: 'e4', employeeName: 'Arjun Nair', type: 'sick-leave', startDate: '2025-12-14', endDate: '2025-12-14', status: 'approved' },
    // Next week
    { id: '5', employeeId: 'e5', employeeName: 'Meera Iyer', type: 'casual-leave', startDate: '2025-12-20', endDate: '2025-12-20', status: 'approved' },
    { id: '6', employeeId: 'e1', employeeName: 'Priya Sharma', type: 'on-duty', startDate: '2025-12-22', endDate: '2025-12-24', status: 'approved' },
    { id: '7', employeeId: 'e6', employeeName: 'Karan Joshi', type: 'wfh', startDate: '2025-12-19', endDate: '2025-12-19', status: 'pending' },
    { id: '8', employeeId: 'e7', employeeName: 'Divya Reddy', type: 'paid-leave', startDate: '2025-12-23', endDate: '2025-12-27', status: 'approved' },
    // December end
    { id: '9', employeeId: 'e8', employeeName: 'Ananya Das', type: 'compensatory', startDate: '2025-12-30', endDate: '2025-12-30', status: 'approved' },
    { id: '10', employeeId: 'e3', employeeName: 'Sneha Patel', type: 'paid-leave', startDate: '2025-12-30', endDate: '2025-12-31', status: 'approved' },
];

export default function TeamCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

    // Get unique employees
    const employees = useMemo(() => {
        const unique = new Map<string, { id: string; name: string }>();
        DEMO_LEAVES.forEach(leave => {
            unique.set(leave.employeeId, { id: leave.employeeId, name: leave.employeeName });
        });
        return Array.from(unique.values());
    }, []);

    // Filter leaves
    const filteredLeaves = useMemo(() => {
        return DEMO_LEAVES.filter(leave => {
            if (selectedType !== 'all' && leave.type !== selectedType) return false;
            if (selectedEmployee !== 'all' && leave.employeeId !== selectedEmployee) return false;
            return true;
        });
    }, [selectedType, selectedEmployee]);

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days: Date[] = [];

        // Pad with previous month
        const startPadding = firstDay.getDay();
        for (let i = startPadding - 1; i >= 0; i--) {
            days.push(new Date(year, month, -i));
        }

        // Current month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            days.push(new Date(year, month, day));
        }

        // Pad to complete 6 weeks (42 days)
        while (days.length < 42) {
            days.push(new Date(year, month + 1, days.length - lastDay.getDate() - startPadding + 1));
        }

        return days;
    }, [currentDate]);

    const getEventsForDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return filteredLeaves.filter(leave => {
            return dateStr >= leave.startDate && dateStr <= leave.endDate;
        });
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
        return day === 0 || day === 6;
    };

    const changeMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
            return newDate;
        });
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    return (
        <Card className="border-0 shadow-lg bg-white overflow-hidden">
            <CardHeader className="pb-4 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Team Calendar</CardTitle>
                            <p className="text-sm text-slate-500">Leave & WFH Overview</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={selectedType} onValueChange={setSelectedType}>
                            <SelectTrigger className="w-[130px] h-9 bg-white">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {Object.entries(LEAVE_CONFIG).map(([key, config]) => (
                                    <SelectItem key={key} value={key}>
                                        <span className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                                            {config.label}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                            <SelectTrigger className="w-[140px] h-9 bg-white">
                                <SelectValue placeholder="All Employees" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Employees</SelectItem>
                                {employees.map(emp => (
                                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => changeMonth('prev')} className="h-8 w-8 p-0">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <h3 className="font-bold text-slate-900 min-w-[160px] text-center">
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                        <Button variant="outline" size="sm" onClick={() => changeMonth('next')} className="h-8 w-8 p-0">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button variant="outline" size="sm" onClick={goToToday} className="h-8">
                        Today
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-4">
                {/* Legend */}
                <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-slate-100">
                    {Object.entries(LEAVE_CONFIG).map(([key, config]) => (
                        <div key={key} className="flex items-center gap-1.5">
                            <span className={`w-3 h-3 rounded-full ${config.dot}`} />
                            <span className="text-xs text-slate-600">{config.short}</span>
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {/* Day Headers */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-xs font-semibold text-slate-500 py-2">
                            {day}
                        </div>
                    ))}

                    {/* Calendar Days */}
                    {calendarDays.map((date, idx) => {
                        const events = getEventsForDate(date);
                        const dateIsToday = isToday(date);
                        const dateIsCurrentMonth = isCurrentMonth(date);
                        const dateIsWeekend = isWeekend(date);

                        return (
                            <div
                                key={idx}
                                className={`
                                    min-h-[80px] md:min-h-[100px] p-1 border rounded-lg transition-colors
                                    ${dateIsCurrentMonth ? 'bg-white' : 'bg-slate-50/50'}
                                    ${dateIsToday ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-100'}
                                    ${dateIsWeekend && dateIsCurrentMonth ? 'bg-slate-50' : ''}
                                `}
                            >
                                <div className={`
                                    text-xs font-medium mb-1 flex items-center justify-center w-6 h-6 rounded-full
                                    ${dateIsToday ? 'bg-indigo-600 text-white' : ''}
                                    ${!dateIsToday && dateIsCurrentMonth ? 'text-slate-700' : 'text-slate-400'}
                                `}>
                                    {date.getDate()}
                                </div>

                                <div className="space-y-0.5 overflow-hidden">
                                    {events.slice(0, 2).map(event => {
                                        const config = LEAVE_CONFIG[event.type];
                                        return (
                                            <div
                                                key={event.id}
                                                className={`
                                                    text-[10px] px-1 py-0.5 rounded truncate flex items-center gap-1
                                                    ${config.bg} ${config.text}
                                                    ${event.status === 'pending' ? 'opacity-60' : ''}
                                                `}
                                                title={`${event.employeeName} - ${config.label}`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${config.dot} flex-shrink-0`} />
                                                <span className="truncate hidden md:inline">{event.employeeName.split(' ')[0]}</span>
                                                <span className="md:hidden">{config.short}</span>
                                            </div>
                                        );
                                    })}
                                    {events.length > 2 && (
                                        <div className="text-[10px] text-slate-500 px-1">
                                            +{events.length - 2} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Upcoming Leave List */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        Upcoming Leaves
                    </h4>
                    <ScrollArea className="h-[200px]">
                        <div className="space-y-2 pr-4">
                            {filteredLeaves
                                .filter(l => new Date(l.startDate) >= new Date())
                                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                                .slice(0, 10)
                                .map(leave => {
                                    const config = LEAVE_CONFIG[leave.type];
                                    const IconComponent = config.icon;
                                    const start = new Date(leave.startDate);
                                    const end = new Date(leave.endDate);
                                    const isSameDay = leave.startDate === leave.endDate;

                                    return (
                                        <div
                                            key={leave.id}
                                            className={`
                                                flex items-center gap-3 p-3 rounded-xl border
                                                ${config.bg} ${config.border}
                                                ${leave.status === 'pending' ? 'opacity-70' : ''}
                                            `}
                                        >
                                            <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                                                <AvatarImage src={leave.employeeAvatar} />
                                                <AvatarFallback className={`${config.bg} ${config.text} text-xs font-bold`}>
                                                    {leave.employeeName.split(' ').map(n => n[0]).join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 truncate">
                                                    {leave.employeeName}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {isSameDay 
                                                        ? start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                                        : `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                                                    }
                                                </p>
                                            </div>
                                            <Badge className={`${config.bg} ${config.text} border-0 text-[10px] flex items-center gap-1`}>
                                                <IconComponent className="w-3 h-3" />
                                                {config.short}
                                            </Badge>
                                            {leave.status === 'pending' && (
                                                <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600 bg-amber-50">
                                                    Pending
                                                </Badge>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
}
