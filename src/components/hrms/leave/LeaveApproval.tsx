/**
 * Leave Approval Component
 * For PM/CTO to approve or reject leave requests
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { leaveService } from '@/services/hrms/leaveService';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, XCircle, Clock, Calendar, User } from 'lucide-react';
import type { LeaveRequest } from '@/types/hrms';

export default function LeaveApproval() {
    const { user, organisation } = useAuth();
    const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (organisation) {
            loadPendingRequests();
        }
    }, [organisation]);

    const loadPendingRequests = () => {
        if (!organisation?.id) return;
        const requests = leaveService.getPendingRequests(organisation.id);
        setPendingRequests(requests);
    };

    const handleApprove = async (leaveId: string) => {
        if (!user?.id) return;

        setLoading(leaveId);
        setMessage(null);

        try {
            const approved = leaveService.approveLeave(leaveId, user.id);
            setMessage({
                type: 'success',
                text: `Leave request approved for ${approved.employeeName}`
            });
            loadPendingRequests();
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.message || 'Failed to approve leave'
            });
        } finally {
            setLoading(null);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleReject = async (leaveId: string) => {
        if (!user?.id) return;

        const reason = prompt('Please provide a reason for rejection:');
        if (!reason) return;

        setLoading(leaveId);
        setMessage(null);

        try {
            const rejected = leaveService.rejectLeave(leaveId, reason);
            setMessage({
                type: 'success',
                text: `Leave request rejected for ${rejected.employeeName}`
            });
            loadPendingRequests();
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.message || 'Failed to reject leave'
            });
        } finally {
            setLoading(null);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const getLeaveTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            'Work From Home': 'bg-blue-100 text-blue-700 border-blue-300',
            'On Duty': 'bg-purple-100 text-purple-700 border-purple-300',
            'Paid Leave': 'bg-green-100 text-green-700 border-green-300',
            'Unpaid Leave': 'bg-orange-100 text-orange-700 border-orange-300',
            'Sick Leave': 'bg-red-100 text-red-700 border-red-300',
            'Casual Leave': 'bg-yellow-100 text-yellow-700 border-yellow-300'
        };
        return colors[type] || 'bg-gray-100 text-gray-700 border-gray-300';
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const calculateDuration = (start: string, end: string, totalDays: number) => {
        if (totalDays === 0.5) return 'Half Day';
        if (totalDays === 1) return '1 Day';
        return `${totalDays} Days`;
    };

    // Check if user has approval permissions
    const canApprove = user?.role === 'admin' || user?.role === 'Project Manager' || user?.role === 'CTO';

    if (!canApprove) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <XCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-600">You don't have permission to approve leave requests.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Clock className="w-8 h-8 text-yellow-600" />
                            <div>
                                <p className="text-2xl font-bold text-yellow-700">{pendingRequests.length}</p>
                                <p className="text-sm text-yellow-600">Pending Requests</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                            <div>
                                <p className="text-2xl font-bold text-green-700">
                                    {leaveService.getPendingRequests(organisation?.id || '').length}
                                </p>
                                <p className="text-sm text-green-600">This Month</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-8 h-8 text-blue-600" />
                            <div>
                                <p className="text-2xl font-bold text-blue-700">
                                    {leaveService.getUpcomingLeaves(organisation?.id || '', 7).length}
                                </p>
                                <p className="text-sm text-blue-600">Upcoming (7 days)</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Message Display */}
            {message && (
                <div className={`p-4 rounded-lg border-2 ${message.type === 'success'
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                    <p className="font-medium">{message.text}</p>
                </div>
            )}

            {/* Pending Requests */}
            <Card>
                <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white">
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-6 h-6" />
                        Pending Leave Requests
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    {pendingRequests.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p>No pending leave requests</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingRequests.map((request) => (
                                <div
                                    key={request.id}
                                    className="border-2 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                <User className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-lg">{request.employeeName}</p>
                                                <p className="text-sm text-gray-600">
                                                    Requested on {formatDate(request.createdAt)}
                                                </p>
                                            </div>
                                        </div>

                                        <span className={`px-3 py-1 rounded-full text-sm font-medium border-2 ${getLeaveTypeColor(request.leaveType)}`}>
                                            {request.leaveType}
                                        </span>
                                    </div>

                                    {/* Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="text-xs text-gray-600 mb-1">From</p>
                                            <p className="font-semibold">{formatDate(request.startDate)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600 mb-1">To</p>
                                            <p className="font-semibold">{formatDate(request.endDate)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600 mb-1">Duration</p>
                                            <p className="font-semibold">
                                                {calculateDuration(request.startDate, request.endDate, request.totalDays)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Reason */}
                                    <div className="mb-4">
                                        <p className="text-xs text-gray-600 mb-1">Reason</p>
                                        <p className="text-sm bg-white p-3 rounded border">{request.reason}</p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => handleApprove(request.id)}
                                            disabled={loading === request.id}
                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                        >
                                            {loading === request.id ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Approve
                                                </>
                                            )}
                                        </Button>

                                        <Button
                                            onClick={() => handleReject(request.id)}
                                            disabled={loading === request.id}
                                            variant="outline"
                                            className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
