import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { allocationReportsService, AllocationReport } from '@/services/allocationReportsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Calendar, TrendingUp, AlertTriangle, Users, ArrowRight,
    CheckCircle2, Clock, BarChart3, PieChart, FileText, Trash2,
    Sparkles, Zap, Target, ArrowLeft, Activity, Brain, ChevronRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AllocationReports() {
    const navigate = useNavigate();
    const { reportId } = useParams();
    const [reports, setReports] = useState<AllocationReport[]>([]);
    const [selectedReport, setSelectedReport] = useState<AllocationReport | null>(null);

    useEffect(() => {
        // Check for corrupted data and clear if necessary
        try {
            const rawData = localStorage.getItem('allocx_allocation_reports');
            if (rawData) {
                const parsed = JSON.parse(rawData);
                // Check if any report has object risks
                const hasCorruption = parsed.some((r: any) =>
                    r.plan?.risks?.some((risk: any) => typeof risk === 'object')
                );

                if (hasCorruption) {
                    console.warn('[AI Reports] Detected corrupted data, clearing localStorage');
                    localStorage.removeItem('allocx_allocation_reports');
                }
            }
        } catch (error) {
            console.error('[AI Reports] Error checking data, clearing localStorage', error);
            localStorage.removeItem('allocx_allocation_reports');
        }

        loadReports();
    }, []);

    useEffect(() => {
        if (reportId && reports.length > 0) {
            const report = allocationReportsService.getReportById(reportId);
            if (report) {
                setSelectedReport(report);
            }
        } else if (!reportId && reports.length > 0 && !selectedReport) {
            // Auto-select first report if no specific ID and nothing selected
            setSelectedReport(reports[0]);
        }
    }, [reportId, reports]);

    const loadReports = () => {
        const loadedReports = allocationReportsService.getAllReports();
        console.log('[AI Reports] Loaded reports from localStorage:', loadedReports);
        setReports(loadedReports);
    };

    const handleDelete = (id: string) => {
        if (confirm('Delete this allocation report?')) {
            allocationReportsService.deleteReport(id);
            loadReports();
            if (selectedReport?.id === id) {
                setSelectedReport(null);
            }
        }
    };

    const stats = allocationReportsService.getStats();

    console.log('[AI Reports] Current state - Reports:', reports.length, 'Selected:', selectedReport?.id, 'Stats:', stats);

    return (
        <div className="h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex flex-col">
            {/* Hero Header */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08),transparent_60%)] opacity-50" />
                
                <div className="relative px-4 sm:px-8 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg">
                                <Brain className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2 flex-wrap">
                                    AI Reports
                                    <Badge className="bg-white/20 text-white border-0 font-medium text-[10px] sm:text-xs">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        AI-Powered
                                    </Badge>
                                </h1>
                                <p className="text-white/70 text-xs sm:text-sm mt-0.5 hidden sm:block">
                                    Historical AI-generated allocation plans and intelligent insights
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                            {reports.length === 0 && (
                                <Button
                                    onClick={() => {
                                        const testPlan = {
                                            moves: [
                                                {
                                                    memberId: "test-1",
                                                    sourceTeamId: null,
                                                    targetTeamId: "team-1",
                                                    memberName: "John Doe",
                                                    targetTeamName: "Alpha Team",
                                                    reasoning: "Test allocation for demonstration",
                                                    priority: "high" as const
                                                }
                                            ],
                                            risks: ["This is a test report"],
                                            summary: "Test allocation plan for demonstration purposes"
                                        };
                                        allocationReportsService.saveReport(testPlan, false);
                                        loadReports();
                                    }}
                                    size="sm"
                                    className="bg-white text-indigo-600 hover:bg-white/90 text-xs sm:text-sm whitespace-nowrap"
                                >
                                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    Generate Test
                                </Button>
                            )}
                            {reports.length > 0 && (
                                <Button
                                    onClick={() => {
                                        if (confirm('Delete all allocation reports? This cannot be undone.')) {
                                            localStorage.removeItem('allocx_allocation_reports');
                                            loadReports();
                                            setSelectedReport(null);
                                        }
                                    }}
                                    variant="secondary"
                                    size="sm"
                                    className="bg-red-500/20 hover:bg-red-500/30 text-white border-0 text-xs sm:text-sm whitespace-nowrap"
                                >
                                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    Clear All
                                </Button>
                            )}
                            <Button 
                                onClick={() => navigate('/dashboard/allocation')} 
                                variant="secondary"
                                size="sm"
                                className="bg-white/10 hover:bg-white/20 text-white border-0 text-xs sm:text-sm whitespace-nowrap"
                            >
                                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                Back
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="px-4 sm:px-8 py-4 sm:py-5 bg-white border-b border-slate-200 overflow-x-auto">
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4 min-w-[500px] sm:min-w-0">
                    <div className="group relative bg-gradient-to-br from-indigo-50 to-violet-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-indigo-100 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                            <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-0 text-[8px] sm:text-[10px] hidden sm:flex">Total</Badge>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats.totalReports}</p>
                        <p className="text-[10px] sm:text-xs text-slate-500">Reports</p>
                    </div>

                    <div className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-emerald-100 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                            <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-0 text-[8px] sm:text-[10px] hidden sm:flex">Applied</Badge>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats.appliedReports}</p>
                        <p className="text-[10px] sm:text-xs text-slate-500">Executed</p>
                    </div>

                    <div className="group relative bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-100 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-0 text-[8px] sm:text-[10px] hidden sm:flex">Moves</Badge>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats.totalMoves}</p>
                        <p className="text-[10px] sm:text-xs text-slate-500">Moves</p>
                    </div>

                    <div className="group relative bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-orange-100 hover:shadow-md transition-all hidden sm:block">
                        <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-0 text-[8px] sm:text-[10px]">Changes</Badge>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats.totalReplacements}</p>
                        <p className="text-[10px] sm:text-xs text-slate-500">Replacements</p>
                    </div>

                    <div className="group relative bg-gradient-to-br from-red-50 to-rose-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-red-100 hover:shadow-md transition-all hidden sm:block">
                        <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                            <Badge variant="outline" className="bg-red-100 text-red-700 border-0 text-[8px] sm:text-[10px]">Risks</Badge>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats.totalRisks}</p>
                        <p className="text-[10px] sm:text-xs text-slate-500">Risks Identified</p>
                    </div>
                </div>
            </div>

            {/* Main Content - Responsive Layout */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Reports List - Full width on mobile, sidebar on desktop */}
                <div className="w-full md:w-72 lg:w-80 bg-white/80 backdrop-blur-sm border-b md:border-b-0 md:border-r border-slate-200 flex flex-col max-h-48 md:max-h-none">
                    <div className="px-3 sm:px-4 py-3 sm:py-4 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-indigo-600" />
                            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Report History</h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{reports.length} reports saved</p>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-2 sm:p-3 space-y-2 flex md:block overflow-x-auto md:overflow-x-visible gap-2 md:gap-0">
                            {reports.map((report) => (
                                <div
                                    key={report.id}
                                    onClick={() => setSelectedReport(report)}
                                    className={`group p-3 sm:p-4 rounded-lg sm:rounded-xl border cursor-pointer transition-all flex-shrink-0 w-64 md:w-auto ${selectedReport?.id === report.id
                                        ? 'bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-200 shadow-md'
                                        : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedReport?.id === report.id ? 'bg-indigo-100' : 'bg-slate-100 group-hover:bg-indigo-50'}`}>
                                                <Brain className={`w-4 h-4 ${selectedReport?.id === report.id ? 'text-indigo-600' : 'text-slate-500 group-hover:text-indigo-500'}`} />
                                            </div>
                                            <span className="text-xs text-slate-500">
                                                {formatDistanceToNow(new Date(report.timestamp), { addSuffix: true })}
                                            </span>
                                        </div>
                                        {report.applied && (
                                            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                Applied
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1 text-slate-600">
                                                <Users className="w-3 h-3" />
                                                {report.plan.moves.length} moves
                                            </span>
                                            <span className="flex items-center gap-1 text-amber-600">
                                                <AlertTriangle className="w-3 h-3" />
                                                {report.plan.risks.length} risks
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(report.id);
                                            }}
                                            className="p-1.5 hover:bg-red-100 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {reports.length === 0 && (
                                <div className="text-center py-16 text-slate-400">
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Brain className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="font-medium text-slate-600">No reports yet</p>
                                    <p className="text-xs mt-1">Run Auto Allocate to generate reports</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Report Details */}
                {selectedReport ? (
                    <SafeReportDetails report={selectedReport} onError={() => {
                        console.error('[AI Reports] Error rendering report, clearing it');
                        allocationReportsService.deleteReport(selectedReport.id);
                        loadReports();
                        setSelectedReport(null);
                    }} />
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-slate-50/50">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-white rounded-2xl border border-slate-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <BarChart3 className="w-10 h-10 text-slate-300" />
                            </div>
                            <p className="text-lg font-medium text-slate-600">Select a report to view details</p>
                            <p className="text-sm text-slate-400 mt-1">Choose from the list on the left</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function SafeReportDetails({ report, onError }: { report: AllocationReport; onError: () => void }) {
    try {
        return <ReportDetails report={report} />;
    } catch (error) {
        console.error('[SafeReportDetails] Render error:', error);
        onError();
        return (
            <div className="flex-1 flex items-center justify-center text-red-400">
                <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
                    <p className="text-lg font-medium text-red-700 mb-2">Error Loading Report</p>
                    <p className="text-sm text-red-600">This report has been removed due to corrupted data.</p>
                </div>
            </div>
        );
    }
}

function ReportDetails({ report }: { report: AllocationReport }) {
    const { plan } = report;

    // Calculate metrics
    const priorityCounts = plan.moves.reduce((acc, move) => {
        const p = move.priority || 'medium';
        acc[p] = (acc[p] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const urgencyCounts = (plan.replacements || []).reduce((acc, rep) => {
        acc[rep.urgency] = (acc[rep.urgency] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <ScrollArea className="flex-1 bg-gray-50">
            <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
                {/* Header */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-xl">Allocation Plan Summary</CardTitle>
                                <CardDescription className="mt-2">
                                    Generated on {new Date(report.timestamp).toLocaleString()}
                                </CardDescription>
                            </div>
                            {report.applied && (
                                <Badge className="bg-green-100 text-green-700">Applied</Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-700">{plan.summary}</p>
                    </CardContent>
                </Card>

                {/* Visual Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Moves by Priority */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <PieChart className="w-4 h-4" />
                                Moves by Priority
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {Object.entries(priorityCounts).map(([priority, count]) => (
                                    <div key={priority} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${priority === 'critical' ? 'bg-red-500' :
                                                priority === 'high' ? 'bg-orange-500' :
                                                    priority === 'medium' ? 'bg-yellow-500' :
                                                        'bg-gray-400'
                                                }`} />
                                            <span className="text-sm capitalize">{priority}</span>
                                        </div>
                                        <span className="text-sm font-semibold">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Replacement Urgency */}
                    {plan.replacements && plan.replacements.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4" />
                                    Replacements by Urgency
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {Object.entries(urgencyCounts).map(([urgency, count]) => (
                                        <div key={urgency} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${urgency === 'critical' ? 'bg-red-500' :
                                                    urgency === 'moderate' ? 'bg-orange-500' :
                                                        'bg-yellow-500'
                                                    }`} />
                                                <span className="text-sm capitalize">{urgency}</span>
                                            </div>
                                            <span className="text-sm font-semibold">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Timeline Analysis */}
                {plan.timeline && (plan.timeline.onTrackProjects || plan.timeline.atRiskProjects || plan.timeline.recommendedShifts || plan.timeline.urgentActions) && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Timeline Outlook</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {plan.timeline.onTrackProjects && plan.timeline.onTrackProjects.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-700 mb-2">On Track</h4>
                                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                                        {plan.timeline.onTrackProjects.map((item, idx) => (
                                            <li key={`onTrack-${idx}`}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {plan.timeline.atRiskProjects && plan.timeline.atRiskProjects.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-700 mb-2">At Risk</h4>
                                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                                        {plan.timeline.atRiskProjects.map((item, idx) => (
                                            <li key={`risk-${idx}`}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {plan.timeline.recommendedShifts && plan.timeline.recommendedShifts.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-700 mb-2">Recommended Shifts</h4>
                                    <div className="space-y-2">
                                        {plan.timeline.recommendedShifts.map((shift, idx) => (
                                            <div key={`shift-${idx}`} className="rounded border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-900">
                                                <div className="font-semibold">
                                                    {shift.memberName || shift.memberId} → {shift.targetTeamName || shift.targetTeamId}
                                                </div>
                                                <div className="text-[11px] text-blue-700">
                                                    {shift.reasoning}
                                                    {shift.impact ? ` • Impact: ${shift.impact}` : ''}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {plan.timeline.urgentActions && plan.timeline.urgentActions.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-700 mb-2">Urgent Actions</h4>
                                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                                        {plan.timeline.urgentActions.map((item, idx) => (
                                            <li key={`urgent-${idx}`}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Risks */}
                {plan.risks.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                                <AlertTriangle className="w-4 h-4" />
                                Identified Risks ({plan.risks.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {plan.risks.map((risk, idx) => {
                                    // Safety: Ensure risk is always a string
                                    const riskText = typeof risk === 'string' ? risk : JSON.stringify(risk);
                                    return (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 bg-amber-50 p-3 rounded border border-amber-100">
                                            <span className="font-medium text-amber-700">{idx + 1}.</span>
                                            <span>{riskText}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {/* Suggested Moves */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Suggested Moves ({plan.moves.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {plan.moves.map((move, idx) => (
                                <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{move.memberName}</Badge>
                                            <ArrowRight className="w-4 h-4 text-gray-400" />
                                            <span className="font-medium text-gray-900">{move.targetTeamName}</span>
                                        </div>
                                        {move.priority && (
                                            <Badge className={`text-xs ${move.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                                move.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                                    move.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-gray-100 text-gray-600'
                                                }`}>
                                                {move.priority}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-600 italic mb-1">{move.reasoning}</p>
                                    {move.expectedImpact && (
                                        <p className="text-xs text-indigo-600 font-medium">Impact: {move.expectedImpact}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Replacement Suggestions */}
                {plan.replacements && plan.replacements.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-orange-700">
                                Replacement Suggestions ({plan.replacements.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {plan.replacements.map((rep, idx) => (
                                    <div key={idx} className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium">
                                                <span className="text-red-600">{rep.currentMemberName}</span> → <span className="text-green-600">{rep.replacementMemberName}</span>
                                            </span>
                                            <Badge className={`text-xs ${rep.urgency === 'critical' ? 'bg-red-100 text-red-700' :
                                                rep.urgency === 'moderate' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {rep.urgency}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-gray-600 italic">{rep.reasoning}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </ScrollArea>
    );
}
