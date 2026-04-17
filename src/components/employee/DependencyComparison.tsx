import { useState, useEffect } from 'react';
import { employeeProfileService } from '@/services/employeeProfileService';
import { EmployeeComparison } from '@/types/employee';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, TrendingUp, Zap, Award, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface DependencyComparisonProps {
    employeeId: string;
}

export default function DependencyComparison({ employeeId }: DependencyComparisonProps) {
    const [comparison, setComparison] = useState<EmployeeComparison | null>(null);

    useEffect(() => {
        const data = employeeProfileService.getComparisons(employeeId);
        setComparison(data);
    }, [employeeId]);

    if (!comparison) {
        return <div className="text-center py-8 text-gray-500">Loading comparisons...</div>;
    }

    const getUtilizationStatus = (utilization: number) => {
        if (utilization < 70) return { label: 'Underutilized', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
        if (utilization <= 90) return { label: 'Optimal', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
        return { label: 'Overloaded', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
    };

    const myStatus = getUtilizationStatus(comparison.workloadComparison.myUtilization);

    return (
        <div className="space-y-6">
            {/* Overall Status */}
            <Card className={`${myStatus.bg} border ${myStatus.border}`}>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Utilization Status</p>
                            <p className={`text-3xl font-bold ${myStatus.color}`}>{myStatus.label}</p>
                            <p className="text-sm text-gray-600 mt-1">
                                {comparison.workloadComparison.myWorkload}h / {comparison.workloadComparison.myCapacity}h
                                ({Math.round(comparison.workloadComparison.myUtilization)}% utilized)
                            </p>
                        </div>
                        {comparison.utilizationStatus === 'optimal' ? (
                            <CheckCircle2 className="w-16 h-16 text-green-500" />
                        ) : (
                            <AlertTriangle className="w-16 h-16 text-yellow-500" />
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Skill Comparisons */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Award className="w-5 h-5 text-indigo-600" />
                        Skill Comparison with Team Members
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {comparison.skillComparisons.slice(0, 5).map((skillComp, idx) => (
                        <div key={idx} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">{skillComp.skill}</span>
                                <Badge className="bg-indigo-100 text-indigo-700">
                                    Your Level: {skillComp.myProficiency}
                                </Badge>
                            </div>
                            <div className="space-y-1.5">
                                {skillComp.comparisons.slice(0, 3).map((comp, compIdx) => (
                                    <div key={compIdx} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                                        <span className="text-gray-700">{comp.employeeName}</span>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={comp.isStronger ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}>
                                                {comp.proficiency}
                                            </Badge>
                                            {comp.isStronger ? (
                                                <span className="text-xs text-green-600 font-medium">Stronger</span>
                                            ) : (
                                                <span className="text-xs text-gray-500">Equal/Weaker</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {comparison.skillComparisons.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">No skill comparisons available</p>
                    )}
                </CardContent>
            </Card>

            {/* Workload Comparison */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" />
                        Workload Comparison
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* My Workload */}
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-indigo-900">You</span>
                            <span className="text-sm text-indigo-700">
                                {comparison.workloadComparison.myWorkload}h / {comparison.workloadComparison.myCapacity}h
                            </span>
                        </div>
                        <Progress value={comparison.workloadComparison.myUtilization} className="h-3" />
                        <p className="text-xs text-indigo-700 mt-1">{Math.round(comparison.workloadComparison.myUtilization)}% Utilized</p>
                    </div>

                    {/* Team Members */}
                    <div className="space-y-2">
                        {comparison.workloadComparison.comparisons.map((comp, idx) => {
                            const status = getUtilizationStatus(comp.utilization);
                            return (
                                <div key={idx} className={`${status.bg} border ${status.border} p-3 rounded-lg`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-gray-900">{comp.employeeName}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-700">
                                                {comp.workload}h / {comp.capacity}h
                                            </span>
                                            <Badge className={comp.difference > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                                                {comp.difference > 0 ? '+' : ''}{comp.difference}h
                                            </Badge>
                                        </div>
                                    </div>
                                    <Progress value={comp.utilization} className="h-2" />
                                    <p className={`text-xs mt-1 ${status.color}`}>{Math.round(comp.utilization)}% Utilized - {status.label}</p>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Experience Comparison */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        Experience & Velocity Comparison
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        {/* Experience */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Experience (Years)</h4>
                            <div className="space-y-2">
                                <div className="bg-indigo-50 border border-indigo-100 p-3 rounded flex items-center justify-between">
                                    <span className="font-medium text-indigo-900">You</span>
                                    <span className="text-lg font-bold text-indigo-900">{comparison.experienceComparison.myExperience}y</span>
                                </div>
                                {comparison.experienceComparison.comparisons.slice(0, 4).map((comp, idx) => (
                                    <div key={idx} className="bg-gray-50 border border-gray-100 p-2 rounded flex items-center justify-between text-sm">
                                        <span className="text-gray-700">{comp.employeeName}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-900">{comp.experience}y</span>
                                            <Badge variant="outline" className={comp.difference > 0 ? 'text-green-600' : 'text-gray-500'}>
                                                {comp.difference > 0 ? '+' : ''}{comp.difference}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Velocity */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Velocity (SP/Sprint)</h4>
                            <div className="space-y-2">
                                <div className="bg-indigo-50 border border-indigo-100 p-3 rounded flex items-center justify-between">
                                    <span className="font-medium text-indigo-900">You</span>
                                    <div className="flex items-center gap-1">
                                        <Zap className="w-4 h-4 text-indigo-600" />
                                        <span className="text-lg font-bold text-indigo-900">{comparison.velocityComparison.myVelocity}</span>
                                    </div>
                                </div>
                                {comparison.velocityComparison.comparisons.slice(0, 4).map((comp, idx) => (
                                    <div key={idx} className="bg-gray-50 border border-gray-100 p-2 rounded flex items-center justify-between text-sm">
                                        <span className="text-gray-700">{comp.employeeName}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-900">{comp.velocity}</span>
                                            <Badge variant="outline" className={comp.difference > 0 ? 'text-green-600' : 'text-gray-500'}>
                                                {comp.difference > 0 ? '+' : ''}{comp.difference.toFixed(1)}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Insights */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100">
                <CardHeader>
                    <CardTitle className="text-lg">AI Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {comparison.workloadComparison.myUtilization < 70 && (
                        <p className="text-sm text-purple-900">
                            💡 This employee has {comparison.workloadComparison.myCapacity - comparison.workloadComparison.myWorkload}h available capacity. Consider assigning additional tasks to optimize utilization.
                        </p>
                    )}
                    {comparison.workloadComparison.myUtilization > 90 && (
                        <p className="text-sm text-purple-900">
                            ⚠️ This employee is at {Math.round(comparison.workloadComparison.myUtilization)}% capacity. Consider redistributing workload to prevent burnout.
                        </p>
                    )}
                    {comparison.velocityComparison.myVelocity > 7 && (
                        <p className="text-sm text-purple-900">
                            ⭐ High velocity performer! ({comparison.velocityComparison.myVelocity} SP/sprint). Excellent candidate for mentorship roles.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
