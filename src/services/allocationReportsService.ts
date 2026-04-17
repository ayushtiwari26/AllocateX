import { AIAllocationResult } from '@/services/aiAllocationService';

export interface AllocationReport {
    id: string;
    timestamp: string;
    plan: AIAllocationResult;
    applied: boolean;
    projectCount: number;
    memberCount: number;
}

const STORAGE_KEY = 'allocx_allocation_reports';

type TimelineInsights = NonNullable<AIAllocationResult['timeline']>;
type RecommendedShifts = TimelineInsights['recommendedShifts'];

const toStringArray = (input: unknown): string[] | undefined => {
    if (!Array.isArray(input)) return undefined;
    const normalized = input
        .map((entry) => {
            if (typeof entry === 'string') return entry;
            if (typeof entry === 'object' && entry !== null) {
                const candidate = (entry as any).description || (entry as any).reason || (entry as any).message || (entry as any).name;
                return candidate ? String(candidate) : JSON.stringify(entry);
            }
            return entry != null ? String(entry) : undefined;
        })
        .filter((value): value is string => Boolean(value && value.trim().length > 0));
    return normalized.length ? normalized : undefined;
};

const mergeUnique = (...lists: Array<string[] | undefined>): string[] | undefined => {
    const merged = new Set<string>();
    lists.forEach((list) => {
        list?.forEach((item) => merged.add(item));
    });
    return merged.size > 0 ? Array.from(merged) : undefined;
};

const normalizeTimeline = (timeline: AIAllocationResult['timeline'] | any): AIAllocationResult['timeline'] | undefined => {
    if (!timeline || typeof timeline !== 'object') return undefined;

    const onTrackProjects = toStringArray(timeline.onTrackProjects);
    const atRiskProjects = mergeUnique(
        toStringArray(timeline.atRiskProjects),
        toStringArray(timeline.criticalProjects),
        toStringArray(timeline.estimatedBottlenecks)
    );
    const urgentActions = mergeUnique(
        toStringArray(timeline.urgentActions),
        toStringArray(timeline.capacityWarnings),
        toStringArray(timeline.estimatedBottlenecks)
    );

    let recommendedShifts: RecommendedShifts;
    if (Array.isArray(timeline.recommendedShifts)) {
        const mapped = timeline.recommendedShifts
            .map((shift: any) => {
                if (!shift || !shift.memberId || !shift.targetTeamId) return null;
                const cleaned = {
                    memberId: String(shift.memberId),
                    memberName: shift.memberName ? String(shift.memberName) : undefined,
                    fromTeamId: shift.fromTeamId !== undefined && shift.fromTeamId !== null ? String(shift.fromTeamId) : null,
                    fromTeamName: shift.fromTeamName ? String(shift.fromTeamName) : undefined,
                    targetTeamId: String(shift.targetTeamId),
                    targetTeamName: shift.targetTeamName ? String(shift.targetTeamName) : undefined,
                    reasoning: shift.reasoning ? String(shift.reasoning) : '',
                    impact: shift.impact ? String(shift.impact) : undefined,
                };
                return cleaned;
            })
            .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

        if (mapped.length > 0) {
            recommendedShifts = mapped as RecommendedShifts;
        }
    }

    const normalized: AIAllocationResult['timeline'] = {};
    if (onTrackProjects) normalized.onTrackProjects = onTrackProjects;
    if (atRiskProjects) normalized.atRiskProjects = atRiskProjects;
    if (recommendedShifts) normalized.recommendedShifts = recommendedShifts;
    if (urgentActions) normalized.urgentActions = urgentActions;

    return Object.keys(normalized).length ? normalized : undefined;
};

export const allocationReportsService = {
    /**
     * Save a new allocation report
     */
    saveReport(plan: AIAllocationResult, applied: boolean = false): AllocationReport {
        const reports = this.getAllReports();

        // Normalize risks to ensure they're all strings
        const normalizedRisks = plan.risks.map(risk => {
            if (typeof risk === 'string') return risk;
            if (typeof risk === 'object' && risk !== null) {
                // Handle object risks by extracting meaningful text
                const riskObj = risk as any;
                return riskObj.name || riskObj.details || riskObj.issue || JSON.stringify(risk);
            }
            return String(risk);
        });

        const normalizedTimeline = normalizeTimeline(plan.timeline);

        const newReport: AllocationReport = {
            id: `report-${Date.now()}`,
            timestamp: new Date().toISOString(),
            plan: {
                ...plan,
                risks: normalizedRisks,
                timeline: normalizedTimeline
            },
            applied,
            projectCount: 0, // Will be calculated from plan
            memberCount: plan.moves.length + (plan.replacements?.length || 0)
        };

        reports.unshift(newReport); // Add to beginning

        // Keep only last 50 reports
        const trimmedReports = reports.slice(0, 50);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedReports));

        return newReport;
    },

    /**
     * Get all allocation reports
     */
    getAllReports(): AllocationReport[] {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];

        try {
            const reports = JSON.parse(data);

            // Repair any corrupted reports (fix object risks and timeline data)
            const repairedReports = reports.map((report: AllocationReport) => {
                // Ensure risks are all strings
                const repairedRisks = report.plan.risks.map(risk => {
                    if (typeof risk === 'string') return risk;
                    if (typeof risk === 'object' && risk !== null) {
                        const riskObj = risk as any;
                        return riskObj.name || riskObj.details || riskObj.issue || JSON.stringify(risk);
                    }
                    return String(risk);
                });

                const repairedTimeline = normalizeTimeline(report.plan.timeline);

                return {
                    ...report,
                    plan: {
                        ...report.plan,
                        risks: repairedRisks,
                        timeline: repairedTimeline
                    }
                };
            });

            // If repairs were made, save back to localStorage
            if (JSON.stringify(reports) !== JSON.stringify(repairedReports)) {
                console.log('[Reports Service] Auto-repaired corrupted data in', repairedReports.length, 'reports');
                localStorage.setItem(STORAGE_KEY, JSON.stringify(repairedReports));
            }

            return repairedReports;
        } catch (error) {
            console.error('[Reports Service] Error loading reports:', error);
            return [];
        }
    },

    /**
     * Get a single report by ID
     */
    getReportById(id: string): AllocationReport | null {
        const reports = this.getAllReports();
        return reports.find(r => r.id === id) || null;
    },

    /**
     * Mark a report as applied
     */
    markAsApplied(id: string): void {
        const reports = this.getAllReports();
        const report = reports.find(r => r.id === id);

        if (report) {
            report.applied = true;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
        }
    },

    /**
     * Delete a report
     */
    deleteReport(id: string): void {
        const reports = this.getAllReports();
        const filtered = reports.filter(r => r.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    },

    /**
     * Get statistics
     */
    getStats() {
        const reports = this.getAllReports();

        return {
            totalReports: reports.length,
            appliedReports: reports.filter(r => r.applied).length,
            totalMoves: reports.reduce((sum, r) => sum + r.plan.moves.length, 0),
            totalReplacements: reports.reduce((sum, r) => sum + (r.plan.replacements?.length || 0), 0),
            totalRisks: reports.reduce((sum, r) => sum + r.plan.risks.length, 0)
        };
    }
};
