/**
 * Leave/WFH Request Notification System
 * Shows pending requests for team leads with approve/reject functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { leaveApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
    Bell,
    Check,
    X,
    Calendar,
    User,
    Clock,
    MessageSquare,
    AlertCircle,
    Loader2,
    CheckCircle2,
    XCircle,
    Home,
    Briefcase,
    HeartPulse,
    Coffee,
    Palmtree
} from 'lucide-react';

interface LeaveRequest {
    id: string;
    employeeId: string;
    employeeName?: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    createdAt?: string;
    employee?: {
        firstName: string;
        lastName: string;
        designation: string;
        department: string;
        avatar?: string;
    };
}

interface NotificationPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

const getLeaveTypeIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
        'wfh': <Home className="w-4 h-4" />,
        'casual': <Coffee className="w-4 h-4" />,
        'sick': <HeartPulse className="w-4 h-4" />,
        'earned': <Palmtree className="w-4 h-4" />,
        'on-duty': <Briefcase className="w-4 h-4" />,
    };
    return icons[type.toLowerCase()] || <Calendar className="w-4 h-4" />;
};

const getLeaveTypeColor = (type: string) => {
    const colors: Record<string, string> = {
        'wfh': 'bg-blue-100 text-blue-700 border-blue-200',
        'casual': 'bg-amber-100 text-amber-700 border-amber-200',
        'sick': 'bg-red-100 text-red-700 border-red-200',
        'earned': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'on-duty': 'bg-purple-100 text-purple-700 border-purple-200',
        'unpaid': 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return colors[type.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200';
};

export default function LeaveNotificationPopup({ isOpen, onClose }: NotificationPopupProps) {
    const { user } = useAuth();
    const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [remarks, setRemarks] = useState('');
    const [showRejectDialog, setShowRejectDialog] = useState(false);

    const loadPendingRequests = useCallback(async () => {
        setLoading(true);
        try {
            const requests = await leaveApi.getPending();
            setPendingRequests(requests || []);
        } catch (error) {
            console.error('Failed to load pending requests:', error);
            // Use mock data for demo
            setPendingRequests([
                {
                    id: 'lr-1',
                    employeeId: 'emp-1',
                    employeeName: 'Rahul Sharma',
                    leaveType: 'wfh',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date().toISOString().split('T')[0],
                    totalDays: 1,
                    reason: 'Internet installation at home, need to be present for the technician.',
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    employee: {
                        firstName: 'Rahul',
                        lastName: 'Sharma',
                        designation: 'Senior Developer',
                        department: 'Engineering'
                    }
                },
                {
                    id: 'lr-2',
                    employeeId: 'emp-2',
                    employeeName: 'Priya Patel',
                    leaveType: 'sick',
                    startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                    endDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
                    totalDays: 2,
                    reason: 'Not feeling well, have fever and cold symptoms.',
                    status: 'pending',
                    createdAt: new Date(Date.now() - 3600000).toISOString(),
                    employee: {
                        firstName: 'Priya',
                        lastName: 'Patel',
                        designation: 'UI/UX Designer',
                        department: 'Design'
                    }
                },
                {
                    id: 'lr-3',
                    employeeId: 'emp-3',
                    employeeName: 'Amit Kumar',
                    leaveType: 'casual',
                    startDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
                    endDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
                    totalDays: 3,
                    reason: 'Family function - sister\'s wedding ceremony.',
                    status: 'pending',
                    createdAt: new Date(Date.now() - 7200000).toISOString(),
                    employee: {
                        firstName: 'Amit',
                        lastName: 'Kumar',
                        designation: 'Backend Developer',
                        department: 'Engineering'
                    }
                }
            ]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadPendingRequests();
        }
    }, [isOpen, loadPendingRequests]);

    const handleApprove = async (request: LeaveRequest) => {
        setActionLoading(request.id);
        try {
            await leaveApi.approve(request.id, remarks || 'Approved');
            setPendingRequests(prev => prev.filter(r => r.id !== request.id));
            setRemarks('');
        } catch (error) {
            console.error('Failed to approve request:', error);
            // For demo, just remove from list
            setPendingRequests(prev => prev.filter(r => r.id !== request.id));
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest || !remarks.trim()) return;
        
        setActionLoading(selectedRequest.id);
        try {
            await leaveApi.reject(selectedRequest.id, remarks);
            setPendingRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
            setShowRejectDialog(false);
            setSelectedRequest(null);
            setRemarks('');
        } catch (error) {
            console.error('Failed to reject request:', error);
            // For demo, just remove from list
            setPendingRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
            setShowRejectDialog(false);
            setSelectedRequest(null);
            setRemarks('');
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getTimeAgo = (dateStr?: string) => {
        if (!dateStr) return '';
        const diff = Date.now() - new Date(dateStr).getTime();
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0">
                    <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-t-lg">
                        <DialogTitle className="flex items-center gap-2 text-white">
                            <Bell className="w-5 h-5" />
                            Leave & WFH Requests
                            {pendingRequests.length > 0 && (
                                <Badge className="bg-white/20 text-white border-0 ml-2">
                                    {pendingRequests.length} pending
                                </Badge>
                            )}
                        </DialogTitle>
                        <DialogDescription className="text-white/70">
                            Review and manage team member requests
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="flex-1 px-6 py-4">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                            </div>
                        ) : pendingRequests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                </div>
                                <h3 className="font-semibold text-slate-900 mb-1">All caught up!</h3>
                                <p className="text-sm text-slate-500">No pending requests to review</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingRequests.map((request) => (
                                    <Card key={request.id} className="border shadow-sm hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-4">
                                                {/* Avatar */}
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                                    {request.employee?.firstName?.[0] || request.employeeName?.[0] || 'E'}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <h4 className="font-semibold text-slate-900">
                                                                {request.employee 
                                                                    ? `${request.employee.firstName} ${request.employee.lastName}`
                                                                    : request.employeeName || 'Employee'}
                                                            </h4>
                                                            <p className="text-sm text-slate-500">
                                                                {request.employee?.designation || 'Team Member'} • {request.employee?.department || 'Department'}
                                                            </p>
                                                        </div>
                                                        <Badge className={`${getLeaveTypeColor(request.leaveType)} border flex items-center gap-1`}>
                                                            {getLeaveTypeIcon(request.leaveType)}
                                                            {request.leaveType.toUpperCase()}
                                                        </Badge>
                                                    </div>

                                                    <div className="mt-3 flex items-center gap-4 text-sm">
                                                        <div className="flex items-center gap-1.5 text-slate-600">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>
                                                                {formatDate(request.startDate)}
                                                                {request.startDate !== request.endDate && (
                                                                    <> → {formatDate(request.endDate)}</>
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-slate-600">
                                                            <Clock className="w-4 h-4" />
                                                            <span>{request.totalDays} day{request.totalDays > 1 ? 's' : ''}</span>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 bg-slate-50 rounded-lg p-3">
                                                        <div className="flex items-start gap-2">
                                                            <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                                            <p className="text-sm text-slate-600">{request.reason}</p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 flex items-center justify-between">
                                                        <span className="text-xs text-slate-400">
                                                            {getTimeAgo(request.createdAt)}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                                                onClick={() => {
                                                                    setSelectedRequest(request);
                                                                    setShowRejectDialog(true);
                                                                }}
                                                                disabled={actionLoading === request.id}
                                                            >
                                                                <X className="w-4 h-4 mr-1" />
                                                                Reject
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                onClick={() => handleApprove(request)}
                                                                disabled={actionLoading === request.id}
                                                            >
                                                                {actionLoading === request.id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                                                ) : (
                                                                    <Check className="w-4 h-4 mr-1" />
                                                                )}
                                                                Approve
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <XCircle className="w-5 h-5" />
                            Reject Request
                        </DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this request.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {selectedRequest && (
                            <div className="bg-slate-50 rounded-lg p-3">
                                <p className="text-sm font-medium text-slate-900">
                                    {selectedRequest.employee 
                                        ? `${selectedRequest.employee.firstName} ${selectedRequest.employee.lastName}`
                                        : selectedRequest.employeeName}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {selectedRequest.leaveType} • {formatDate(selectedRequest.startDate)} - {formatDate(selectedRequest.endDate)}
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Rejection Reason *</Label>
                            <Textarea
                                placeholder="Please provide the reason for rejection..."
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowRejectDialog(false);
                                setSelectedRequest(null);
                                setRemarks('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={handleReject}
                            disabled={!remarks.trim() || actionLoading === selectedRequest?.id}
                        >
                            {actionLoading === selectedRequest?.id ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                            ) : (
                                <X className="w-4 h-4 mr-1" />
                            )}
                            Reject Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

// Bell Icon with Badge for Header
export function NotificationBell({ count, onClick }: { count: number; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
            <Bell className="w-5 h-5 text-slate-600" />
            {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {count > 9 ? '9+' : count}
                </span>
            )}
        </button>
    );
}
