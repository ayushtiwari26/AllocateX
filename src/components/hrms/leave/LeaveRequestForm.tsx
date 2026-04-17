/**
 * Leave Request Form
 * Apply for Leave/WFH/On Duty
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { leaveService } from '@/services/hrms/leaveService';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Send, X } from 'lucide-react';
import type { LeaveType } from '@/types/hrms';

interface LeaveRequestFormProps {
    onSuccess?: () => void;
}

export default function LeaveRequestForm({ onSuccess }: LeaveRequestFormProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [formData, setFormData] = useState({
        leaveType: 'Paid Leave' as LeaveType,
        startDate: '',
        endDate: '',
        halfDayDate: '',
        reason: ''
    });

    const leaveTypes: LeaveType[] = [
        'Paid Leave',
        'Unpaid Leave',
        'Work From Home',
        'On Duty',
        'Sick Leave',
        'Casual Leave'
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) return;

        setLoading(true);
        setMessage(null);

        try {
            // Validation
            if (!formData.startDate || !formData.endDate) {
                throw new Error('Please select start and end dates');
            }

            if (new Date(formData.startDate) > new Date(formData.endDate)) {
                throw new Error('End date must be after start date');
            }

            if (!formData.reason.trim()) {
                throw new Error('Please provide a reason for leave');
            }

            // Submit leave request
            const request = leaveService.requestLeave({
                employeeId: user.id,
                employeeName: user.fullName || user.email,
                leaveType: formData.leaveType,
                startDate: formData.startDate,
                endDate: formData.endDate,
                halfDayDate: formData.halfDayDate || undefined,
                reason: formData.reason
            });

            setMessage({
                type: 'success',
                text: `Leave request submitted successfully! Request ID: ${request.id}`
            });

            // Reset form
            setFormData({
                leaveType: 'Paid Leave',
                startDate: '',
                endDate: '',
                halfDayDate: '',
                reason: ''
            });

            if (onSuccess) {
                setTimeout(onSuccess, 1500);
            }
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.message || 'Failed to submit leave request'
            });
        } finally {
            setLoading(false);
        }
    };

    const getLeaveTypeColor = (type: LeaveType) => {
        const colors = {
            'Paid Leave': 'bg-green-100 text-green-700 border-green-300',
            'Unpaid Leave': 'bg-orange-100 text-orange-700 border-orange-300',
            'Work From Home': 'bg-blue-100 text-blue-700 border-blue-300',
            'On Duty': 'bg-purple-100 text-purple-700 border-purple-300',
            'Sick Leave': 'bg-red-100 text-red-700 border-red-300',
            'Casual Leave': 'bg-yellow-100 text-yellow-700 border-yellow-300',
            'Compensatory Off': 'bg-indigo-100 text-indigo-700 border-indigo-300'
        };
        return colors[type] || 'bg-gray-100 text-gray-700 border-gray-300';
    };

    return (
        <Card className="border-2">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-6 h-6" />
                    Apply for Leave / WFH
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Leave Type Selection */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold">Leave Type *</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {leaveTypes.map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, leaveType: type })}
                                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${formData.leaveType === type
                                            ? getLeaveTypeColor(type)
                                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate" className="text-sm font-semibold">
                                Start Date *
                            </Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                min={new Date().toISOString().split('T')[0]}
                                required
                                className="border-2"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="endDate" className="text-sm font-semibold">
                                End Date *
                            </Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                min={formData.startDate || new Date().toISOString().split('T')[0]}
                                required
                                className="border-2"
                            />
                        </div>
                    </div>

                    {/* Half Day Option */}
                    <div className="space-y-2">
                        <Label htmlFor="halfDayDate" className="text-sm font-semibold">
                            Half Day Date (Optional)
                        </Label>
                        <Input
                            id="halfDayDate"
                            type="date"
                            value={formData.halfDayDate}
                            onChange={(e) => setFormData({ ...formData, halfDayDate: e.target.value })}
                            min={formData.startDate}
                            max={formData.endDate}
                            className="border-2"
                        />
                        <p className="text-xs text-gray-600">
                            If applying for half day, select the date. Leave start and end date same.
                        </p>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="reason" className="text-sm font-semibold">
                            Reason *
                        </Label>
                        <textarea
                            id="reason"
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            placeholder="Please provide a reason for your leave request..."
                            rows={4}
                            required
                            className="w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
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

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button
                            type="submit"
                            disabled={loading}
                            size="lg"
                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5 mr-2" />
                                    Submit Request
                                </>
                            )}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => setFormData({
                                leaveType: 'Paid Leave',
                                startDate: '',
                                endDate: '',
                                halfDayDate: '',
                                reason: ''
                            })}
                        >
                            <X className="w-5 h-5 mr-2" />
                            Clear
                        </Button>
                    </div>

                    {/* Info */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                            <span className="font-semibold">Note:</span> Your leave request will be sent to your manager for approval.
                            You will be notified once it's approved or rejected.
                        </p>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
