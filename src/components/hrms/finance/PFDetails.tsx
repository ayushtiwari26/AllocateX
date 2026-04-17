/**
 * PF (Provident Fund) Details Component
 * Shows and manages PF/EPF information
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { financeService } from '@/services/hrms/financeService';
import { useAuth } from '@/context/AuthContext';
import {
    Landmark,
    Edit,
    Save,
    X,
    CheckCircle2,
    AlertCircle,
    Info
} from 'lucide-react';
import type { EmployeePFDetails, PFStatus } from '@/types/hrms';

interface PFDetailsProps {
    employeeId?: string;
    readOnly?: boolean;
}

export default function PFDetails({ employeeId, readOnly = false }: PFDetailsProps) {
    const { user } = useAuth();
    const targetEmployeeId = employeeId || user?.id;

    const [pfDetails, setPFDetails] = useState<EmployeePFDetails | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        pfStatus: 'Applicable' as PFStatus,
        pfNumber: '',
        uanNumber: '',
        pfJoinDate: '',
        employeeContribution: 12,
        employerContribution: 12,
        isActive: true
    });

    useEffect(() => {
        if (targetEmployeeId) {
            loadPFDetails();
        }
    }, [targetEmployeeId]);

    const loadPFDetails = () => {
        if (!targetEmployeeId) return;
        const data = financeService.getPFDetails(targetEmployeeId);
        if (data) {
            setPFDetails(data);
            setFormData({
                pfStatus: data.pfStatus,
                pfNumber: data.pfNumber || '',
                uanNumber: data.uanNumber || '',
                pfJoinDate: data.pfJoinDate || '',
                employeeContribution: data.employeeContribution || 12,
                employerContribution: data.employerContribution || 12,
                isActive: data.isActive
            });
        }
    };

    const handleSave = async () => {
        if (!targetEmployeeId) return;
        setLoading(true);

        try {
            const saved = financeService.savePFDetails({
                employeeId: targetEmployeeId,
                ...formData
            });
            setPFDetails(saved);
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving PF details:', error);
        } finally {
            setLoading(false);
        }
    };

    const pfStatuses: PFStatus[] = ['Applicable', 'Not Applicable', 'Pending', 'Opted Out'];

    const getStatusColor = (status: PFStatus) => {
        const colors = {
            'Applicable': 'bg-green-100 text-green-700 border-green-300',
            'Not Applicable': 'bg-gray-100 text-gray-700 border-gray-300',
            'Pending': 'bg-yellow-100 text-yellow-700 border-yellow-300',
            'Opted Out': 'bg-red-100 text-red-700 border-red-300'
        };
        return colors[status];
    };

    return (
        <Card className="border-2">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Landmark className="w-5 h-5" />
                        Provident Fund (PF/EPF)
                    </div>
                    {!readOnly && !isEditing && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            className="bg-white/20 hover:bg-white/30"
                        >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                {isEditing ? (
                    <div className="space-y-4">
                        {/* PF Status */}
                        <div className="space-y-2">
                            <Label className="font-semibold">PF Status</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {pfStatuses.map((status) => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, pfStatus: status })}
                                        className={`p-2 rounded-lg border-2 text-sm font-medium transition-all ${
                                            formData.pfStatus === status
                                                ? getStatusColor(status)
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {formData.pfStatus === 'Applicable' && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="pfNumber" className="font-semibold">PF Number</Label>
                                        <Input
                                            id="pfNumber"
                                            value={formData.pfNumber}
                                            onChange={(e) => setFormData({ ...formData, pfNumber: e.target.value })}
                                            placeholder="MH/BOM/12345/67890"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="uanNumber" className="font-semibold">UAN Number</Label>
                                        <Input
                                            id="uanNumber"
                                            value={formData.uanNumber}
                                            onChange={(e) => setFormData({ ...formData, uanNumber: e.target.value })}
                                            placeholder="123456789012"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="pfJoinDate" className="font-semibold">PF Join Date</Label>
                                        <Input
                                            id="pfJoinDate"
                                            type="date"
                                            value={formData.pfJoinDate}
                                            onChange={(e) => setFormData({ ...formData, pfJoinDate: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="font-semibold">Active Status</Label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, isActive: true })}
                                                className={`flex-1 p-2 rounded-lg border-2 text-sm font-medium ${
                                                    formData.isActive
                                                        ? 'border-green-500 bg-green-50 text-green-700'
                                                        : 'border-gray-200 text-gray-600'
                                                }`}
                                            >
                                                Active
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, isActive: false })}
                                                className={`flex-1 p-2 rounded-lg border-2 text-sm font-medium ${
                                                    !formData.isActive
                                                        ? 'border-red-500 bg-red-50 text-red-700'
                                                        : 'border-gray-200 text-gray-600'
                                                }`}
                                            >
                                                Inactive
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Contribution Rates */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="employeeContribution" className="font-semibold">
                                            Employee Contribution (%)
                                        </Label>
                                        <Input
                                            id="employeeContribution"
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={formData.employeeContribution}
                                            onChange={(e) => setFormData({ ...formData, employeeContribution: Number(e.target.value) })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="employerContribution" className="font-semibold">
                                            Employer Contribution (%)
                                        </Label>
                                        <Input
                                            id="employerContribution"
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={formData.employerContribution}
                                            onChange={(e) => setFormData({ ...formData, employerContribution: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsEditing(false);
                                    loadPFDetails();
                                }}
                            >
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={loading}
                                className="bg-indigo-600 hover:bg-indigo-700"
                            >
                                <Save className="w-4 h-4 mr-1" />
                                {loading ? 'Saving...' : 'Save Details'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pfDetails ? (
                            <>
                                {/* Status Badge */}
                                <div className="flex items-center justify-between">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(pfDetails.pfStatus)}`}>
                                        {pfDetails.pfStatus}
                                    </span>
                                    {pfDetails.isActive && pfDetails.pfStatus === 'Applicable' && (
                                        <span className="flex items-center gap-1 text-green-600 text-sm">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Active
                                        </span>
                                    )}
                                </div>

                                {pfDetails.pfStatus === 'Applicable' && (
                                    <>
                                        {/* PF Numbers */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
                                                <p className="text-xs text-indigo-600 font-medium mb-1">PF Number</p>
                                                <p className="text-lg font-semibold text-indigo-800 font-mono">
                                                    {pfDetails.pfNumber || 'Not assigned'}
                                                </p>
                                            </div>
                                            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                                                <p className="text-xs text-purple-600 font-medium mb-1">UAN Number</p>
                                                <p className="text-lg font-semibold text-purple-800 font-mono">
                                                    {pfDetails.uanNumber || 'Not assigned'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Contribution Info */}
                                        <div className="p-4 rounded-lg bg-gray-50 border">
                                            <h4 className="font-semibold text-gray-700 mb-3">Contribution Details</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-xs text-gray-500">Employee Contribution</p>
                                                    <p className="text-xl font-bold text-gray-800">{pfDetails.employeeContribution || 12}%</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Employer Contribution</p>
                                                    <p className="text-xl font-bold text-gray-800">{pfDetails.employerContribution || 12}%</p>
                                                </div>
                                                {pfDetails.pfJoinDate && (
                                                    <div>
                                                        <p className="text-xs text-gray-500">PF Join Date</p>
                                                        <p className="text-sm font-medium text-gray-800">
                                                            {new Date(pfDetails.pfJoinDate).toLocaleDateString('en-IN', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Info Box */}
                                        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                                            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                            <div className="text-sm text-blue-800">
                                                <p className="font-medium">EPF Benefits</p>
                                                <p>Your PF contributions earn interest and provide retirement benefits. Check your balance on EPFO portal.</p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {pfDetails.pfStatus === 'Not Applicable' && (
                                    <div className="flex items-center gap-2 p-4 rounded-lg bg-gray-50 border border-gray-200">
                                        <AlertCircle className="w-5 h-5 text-gray-500" />
                                        <p className="text-gray-600">PF is not applicable for this employee based on their employment terms.</p>
                                    </div>
                                )}

                                {pfDetails.pfStatus === 'Opted Out' && (
                                    <div className="flex items-center gap-2 p-4 rounded-lg bg-amber-50 border border-amber-200">
                                        <AlertCircle className="w-5 h-5 text-amber-600" />
                                        <p className="text-amber-700">Employee has opted out of PF scheme.</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <Landmark className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500">No PF details available</p>
                                {!readOnly && (
                                    <Button
                                        className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        <Edit className="w-4 h-4 mr-1" />
                                        Add PF Details
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
