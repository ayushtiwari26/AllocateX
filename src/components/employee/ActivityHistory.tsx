import { useState, useEffect } from 'react';
import { employeeProfileService } from '@/services/employeeProfileService';
import { ActivityLog } from '@/types/employee';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, FolderPlus, Award, Calendar, TrendingUp, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityHistoryProps {
    employeeId: string;
    activities?: ActivityLog[];
}

const activityIcons: Record<string, any> = {
    'task_completed': CheckCircle2,
    'project_assigned': FolderPlus,
    'skill_updated': Award,
    'leave_requested': Calendar,
    'sprint_contribution': TrendingUp,
    'other': Clock
};

const activityColors: Record<string, string> = {
    'task_completed': 'bg-green-100 text-green-700 border-green-200',
    'project_assigned': 'bg-blue-100 text-blue-700 border-blue-200',
    'skill_updated': 'bg-purple-100 text-purple-700 border-purple-200',
    'leave_requested': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'sprint_contribution': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'other': 'bg-gray-100 text-gray-700 border-gray-200'
};

export default function ActivityHistory({ employeeId, activities }: ActivityHistoryProps) {
    const [internalActivities, setInternalActivities] = useState<ActivityLog[]>(activities ?? []);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        if (activities) {
            setInternalActivities(activities);
            return;
        }
        const data = employeeProfileService.getActivityLogs(employeeId, 50);
        setInternalActivities(data);
    }, [employeeId, activities]);

    const effectiveActivities = internalActivities;

    const filteredActivities = filter === 'all'
        ? effectiveActivities
        : effectiveActivities.filter(a => a.type === filter);

    const activityTypes = Array.from(new Set(effectiveActivities.map(a => a.type)));

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <Card>
                    <CardContent className="pt-3 sm:pt-4">
                        <div className="text-center">
                            <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-green-600" />
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                {effectiveActivities.filter(a => a.type === 'task_completed').length}
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-500">Tasks Completed</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-3 sm:pt-4">
                        <div className="text-center">
                            <FolderPlus className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-blue-600" />
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                {effectiveActivities.filter(a => a.type === 'project_assigned').length}
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-500">Projects Assigned</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-3 sm:pt-4">
                        <div className="text-center">
                            <Award className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-purple-600" />
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                {effectiveActivities.filter(a => a.type === 'skill_updated').length}
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-500">Skills Updated</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-3 sm:pt-4">
                        <div className="text-center">
                            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-indigo-600" />
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                {effectiveActivities.filter(a => a.type === 'sprint_contribution').length}
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-500">Sprint Contributions</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter */}
            <Card>
                <CardHeader className="pb-2 sm:pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <CardTitle className="text-base sm:text-lg">Activity Timeline</CardTitle>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 -mx-2 px-2 sm:mx-0 sm:px-0 scrollbar-hide">
                            <Badge
                                variant={filter === 'all' ? 'default' : 'outline'}
                                className="cursor-pointer whitespace-nowrap flex-shrink-0 text-xs"
                                onClick={() => setFilter('all')}
                            >
                                All ({effectiveActivities.length})
                            </Badge>
                            {activityTypes.map(type => (
                                <Badge
                                    key={type}
                                    variant={filter === type ? 'default' : 'outline'}
                                    className="cursor-pointer whitespace-nowrap flex-shrink-0 text-xs"
                                    onClick={() => setFilter(type)}
                                >
                                    {type.replace('_', ' ')} ({effectiveActivities.filter(a => a.type === type).length})
                                </Badge>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredActivities.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No activities found</p>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Timeline Line */}
                            <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

                            {/* Activities */}
                            <div className="space-y-3 sm:space-y-4">
                                {filteredActivities.map((activity, idx) => {
                                    const Icon = activityIcons[activity.type] || Clock;
                                    const colorClass = activityColors[activity.type] || activityColors['other'];

                                    return (
                                        <div key={activity.id} className="relative pl-10 sm:pl-14">
                                            {/* Timeline Icon */}
                                            <div className={`absolute left-0 sm:left-1 top-1 w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 ${colorClass} flex items-center justify-center bg-white shadow-sm`}>
                                                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </div>

                                            {/* Content */}
                                            <div className={`border ${colorClass} bg-white rounded-lg p-3 sm:p-4 shadow-sm`}>
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-0 mb-1">
                                                    <p className="font-medium text-gray-900 text-sm sm:text-base">{activity.description}</p>
                                                    <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
                                                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                                    </span>
                                                </div>

                                                <Badge variant="outline" className="text-xs mt-2">
                                                    {activity.type.replace('_', ' ')}
                                                </Badge>

                                                {activity.metadata && (
                                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                                        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                                            {Object.entries(activity.metadata).map(([key, value]) => (
                                                                <span key={key} className="bg-gray-50 px-2 py-1 rounded">
                                                                    <span className="font-medium">{key}:</span> {String(value)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
