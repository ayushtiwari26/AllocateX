import type { EmployeeProfile } from '@/types/employee';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Briefcase, Award, TrendingUp, Users } from 'lucide-react';
import { format } from 'date-fns';

interface ProfileOverviewProps {
    profile: EmployeeProfile;
    isEditing: boolean;
    onUpdate: (profile: EmployeeProfile) => void;
}

export default function ProfileOverview({ profile, isEditing, onUpdate }: ProfileOverviewProps) {
    const utilizationPercentage = (profile.currentWorkload / profile.maxCapacity) * 100;

    return (
        <div className="space-y-6">
            {/* Professional Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Professional Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Employee ID</label>
                            <p className="text-gray-900 font-mono">{profile.employeeId}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Join Date</label>
                            <p className="text-gray-900 flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                {format(new Date(profile.joinDate), 'MMM dd, yyyy')}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Department</label>
                            <p className="text-gray-900">{profile.department}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Role</label>
                            <p className="text-gray-900 flex items-center gap-1">
                                <Briefcase className="w-4 h-4 text-gray-400" />
                                {profile.role}
                            </p>
                        </div>
                        {profile.managerId && (
                            <div>
                                <label className="text-sm font-medium text-gray-500">Reports To</label>
                                <p className="text-gray-900">Manager ID: {profile.managerId}</p>
                            </div>
                        )}
                        {profile.teamId && (
                            <div>
                                <label className="text-sm font-medium text-gray-500">Team</label>
                                <p className="text-gray-900 flex items-center gap-1">
                                    <Users className="w-4 h-4 text-gray-400" />
                                    {profile.teamId}
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Current Status & Metrics */}
            <div className="grid grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Current Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Availability</label>
                            <div className="mt-1">
                                <Badge className={
                                    profile.availability === 'available' ? 'bg-green-100 text-green-700' :
                                        profile.availability === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                                            profile.availability === 'overloaded' ? 'bg-red-100 text-red-700' :
                                                'bg-gray-100 text-gray-700'
                                }>
                                    {profile.availability}
                                </Badge>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-500">Workload Utilization</label>
                            <div className="mt-2">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">{profile.currentWorkload}h / {profile.maxCapacity}h per week</span>
                                    <span className={`font-semibold ${utilizationPercentage > 90 ? 'text-red-600' :
                                        utilizationPercentage >= 70 ? 'text-green-600' :
                                            'text-yellow-600'
                                        }`}>
                                        {Math.round(utilizationPercentage)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${utilizationPercentage > 90 ? 'bg-red-500' :
                                            utilizationPercentage >= 70 ? 'bg-green-500' :
                                                'bg-yellow-500'
                                            }`}
                                        style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {profile.leaveStatus?.isOnLeave && (
                            <div className="bg-orange-50 border border-orange-200 p-3 rounded">
                                <p className="text-sm font-medium text-orange-900">Currently on Leave</p>
                                <p className="text-xs text-orange-700 mt-1">
                                    {profile.leaveStatus.leaveType} • {profile.leaveStatus.startDate} to {profile.leaveStatus.endDate}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Velocity</label>
                                <p className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                                    {profile.velocity}
                                    <span className="text-sm font-normal text-gray-500">SP/sprint</span>
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Quality Score</label>
                                <p className="text-2xl font-bold text-gray-900">{profile.qualityScore}<span className="text-sm font-normal text-gray-500">/100</span></p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Collaboration</label>
                                <p className="text-2xl font-bold text-gray-900">{profile.collaborationScore}<span className="text-sm font-normal text-gray-500">/100</span></p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Avg Completion</label>
                                <p className="text-2xl font-bold text-gray-900">{profile.averageTaskCompletionTime}<span className="text-sm font-normal text-gray-500">days</span></p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Completed Tasks</span>
                                <span className="text-lg font-semibold text-green-600">{profile.completedTasks}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-sm text-gray-600">Ongoing Tasks</span>
                                <span className="text-lg font-semibold text-blue-600">{profile.ongoingTasks}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tech Stack Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Tech Stack</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {profile.techStack.map((tech, idx) => (
                            <Badge key={idx} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                {tech}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Strong Areas */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Award className="w-5 h-5 text-indigo-600" />
                        Strong Areas
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                        {profile.strongAreas.map((area, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                                <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                                <span className="text-sm text-gray-900">{area}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
