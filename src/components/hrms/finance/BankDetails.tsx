/**
 * Bank Details Component
 * Shows and manages bank account information
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { financeService } from '@/services/hrms/financeService';
import { useAuth } from '@/context/AuthContext';
import {
    Building2,
    Edit,
    Save,
    X,
    CheckCircle2,
    Shield,
    AlertTriangle
} from 'lucide-react';
import type { EmployeeBankDetails } from '@/types/hrms';

interface BankDetailsProps {
    employeeId?: string;
    readOnly?: boolean;
}

export default function BankDetails({ employeeId, readOnly = false }: BankDetailsProps) {
    const { user } = useAuth();
    const targetEmployeeId = employeeId || user?.id;

    const [bankDetails, setBankDetails] = useState<EmployeeBankDetails | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        accountHolderName: '',
        branchName: '',
        isVerified: false
    });

    useEffect(() => {
        if (targetEmployeeId) {
            loadBankDetails();
        }
    }, [targetEmployeeId]);

    const loadBankDetails = () => {
        if (!targetEmployeeId) return;
        const data = financeService.getBankDetails(targetEmployeeId);
        if (data) {
            setBankDetails(data);
            setFormData({
                bankName: data.bankName,
                accountNumber: data.accountNumber,
                ifscCode: data.ifscCode,
                accountHolderName: data.accountHolderName,
                branchName: data.branchName,
                isVerified: data.isVerified
            });
        }
    };

    const handleSave = async () => {
        if (!targetEmployeeId) return;
        setLoading(true);

        try {
            const saved = financeService.saveBankDetails({
                employeeId: targetEmployeeId,
                ...formData,
                isVerified: false // Reset verification on update
            });
            setBankDetails(saved);
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving bank details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = () => {
        if (!targetEmployeeId) return;
        try {
            const verified = financeService.verifyBankDetails(targetEmployeeId);
            setBankDetails(verified);
        } catch (error) {
            console.error('Error verifying bank details:', error);
        }
    };

    const maskAccountNumber = (accNo: string) => {
        if (!accNo || accNo.length < 4) return accNo;
        return '*'.repeat(accNo.length - 4) + accNo.slice(-4);
    };

    return (
        <Card className="border-2">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Bank Details
                        {bankDetails?.isVerified && (
                            <span className="flex items-center gap-1 bg-green-500/20 text-green-100 px-2 py-1 rounded-full text-xs">
                                <CheckCircle2 className="w-3 h-3" />
                                Verified
                            </span>
                        )}
                    </div>
                    {!readOnly && !isEditing && bankDetails && (
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="bankName" className="font-semibold">Bank Name *</Label>
                                <Input
                                    id="bankName"
                                    value={formData.bankName}
                                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                    placeholder="HDFC Bank"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="branchName" className="font-semibold">Branch Name *</Label>
                                <Input
                                    id="branchName"
                                    value={formData.branchName}
                                    onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                                    placeholder="Mumbai - Andheri West"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="accountNumber" className="font-semibold">Account Number *</Label>
                                <Input
                                    id="accountNumber"
                                    value={formData.accountNumber}
                                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                    placeholder="1234567890"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="ifscCode" className="font-semibold">IFSC Code *</Label>
                                <Input
                                    id="ifscCode"
                                    value={formData.ifscCode}
                                    onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                                    placeholder="HDFC0001234"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="accountHolderName" className="font-semibold">Account Holder Name *</Label>
                                <Input
                                    id="accountHolderName"
                                    value={formData.accountHolderName}
                                    onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                                    placeholder="As per bank records"
                                />
                            </div>
                        </div>

                        {/* Warning */}
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-800">
                                <p className="font-medium">Important</p>
                                <p>Please ensure bank details are accurate. Incorrect details may delay salary payments.</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsEditing(false);
                                    loadBankDetails();
                                }}
                            >
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={loading || !formData.bankName || !formData.accountNumber || !formData.ifscCode}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Save className="w-4 h-4 mr-1" />
                                {loading ? 'Saving...' : 'Save Details'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bankDetails ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-lg bg-gray-50 border">
                                        <p className="text-xs text-gray-500 font-medium mb-1">Bank Name</p>
                                        <p className="text-lg font-semibold text-gray-800">{bankDetails.bankName}</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-gray-50 border">
                                        <p className="text-xs text-gray-500 font-medium mb-1">Branch</p>
                                        <p className="text-lg font-semibold text-gray-800">{bankDetails.branchName}</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-gray-50 border">
                                        <p className="text-xs text-gray-500 font-medium mb-1">Account Number</p>
                                        <p className="text-lg font-semibold text-gray-800 font-mono">
                                            {maskAccountNumber(bankDetails.accountNumber)}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-gray-50 border">
                                        <p className="text-xs text-gray-500 font-medium mb-1">IFSC Code</p>
                                        <p className="text-lg font-semibold text-gray-800 font-mono">{bankDetails.ifscCode}</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-gray-50 border md:col-span-2">
                                        <p className="text-xs text-gray-500 font-medium mb-1">Account Holder Name</p>
                                        <p className="text-lg font-semibold text-gray-800">{bankDetails.accountHolderName}</p>
                                    </div>
                                </div>

                                {/* Verification Status */}
                                {bankDetails.isVerified ? (
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                                        <Shield className="w-5 h-5 text-green-600" />
                                        <div>
                                            <p className="font-medium text-green-800">Bank Account Verified</p>
                                            <p className="text-sm text-green-600">Your bank details have been verified and confirmed.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                                            <div>
                                                <p className="font-medium text-amber-800">Verification Pending</p>
                                                <p className="text-sm text-amber-600">Bank details are awaiting verification.</p>
                                            </div>
                                        </div>
                                        {user?.role === 'admin' && (
                                            <Button
                                                size="sm"
                                                onClick={handleVerify}
                                                className="bg-amber-600 hover:bg-amber-700"
                                            >
                                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                                Verify
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500">No bank details available</p>
                                {!readOnly && (
                                    <Button
                                        className="mt-4 bg-blue-600 hover:bg-blue-700"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        <Edit className="w-4 h-4 mr-1" />
                                        Add Bank Details
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
