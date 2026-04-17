/**
 * Payment Information Component
 * Shows salary, payment method, and CTC details
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { financeService } from '@/services/hrms/financeService';
import { useAuth } from '@/context/AuthContext';
import {
    Wallet,
    CreditCard,
    IndianRupee,
    Edit,
    Save,
    X,
    CheckCircle2
} from 'lucide-react';
import type { EmployeeFinancials, SalaryMode, PaymentMethod } from '@/types/hrms';

interface PaymentInfoProps {
    employeeId?: string;
    readOnly?: boolean;
}

export default function PaymentInfo({ employeeId, readOnly = false }: PaymentInfoProps) {
    const { user } = useAuth();
    const targetEmployeeId = employeeId || user?.id;

    const [financials, setFinancials] = useState<EmployeeFinancials | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        salaryMode: 'Monthly' as SalaryMode,
        paymentMethod: 'Bank Transfer' as PaymentMethod,
        baseSalary: 0,
        ctc: 0,
        hra: 0,
        da: 0,
        specialAllowance: 0,
        variablePay: 0,
        currency: 'INR'
    });

    useEffect(() => {
        if (targetEmployeeId) {
            loadFinancials();
        }
    }, [targetEmployeeId]);

    const loadFinancials = () => {
        if (!targetEmployeeId) return;
        const data = financeService.getFinancials(targetEmployeeId);
        if (data) {
            setFinancials(data);
            setFormData({
                salaryMode: data.salaryMode,
                paymentMethod: data.paymentMethod,
                baseSalary: data.baseSalary,
                ctc: data.ctc,
                hra: data.hra || 0,
                da: data.da || 0,
                specialAllowance: data.specialAllowance || 0,
                variablePay: data.variablePay || 0,
                currency: data.currency
            });
        }
    };

    const handleSave = async () => {
        if (!targetEmployeeId) return;
        setLoading(true);

        try {
            const saved = financeService.saveFinancials({
                employeeId: targetEmployeeId,
                ...formData
            });
            setFinancials(saved);
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving financials:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const salaryModes: SalaryMode[] = ['Monthly', 'Weekly', 'Hourly', 'Project-based'];
    const paymentMethods: PaymentMethod[] = ['Bank Transfer', 'Cash', 'Cheque', 'UPI'];

    return (
        <Card className="border-2">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        Payment Information
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
                    <div className="space-y-6">
                        {/* Salary Mode */}
                        <div className="space-y-2">
                            <Label className="font-semibold">Salary Mode</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {salaryModes.map((mode) => (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, salaryMode: mode })}
                                        className={`p-2 rounded-lg border-2 text-sm font-medium transition-all ${
                                            formData.salaryMode === mode
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-2">
                            <Label className="font-semibold">Payment Method</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {paymentMethods.map((method) => (
                                    <button
                                        key={method}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, paymentMethod: method })}
                                        className={`p-2 rounded-lg border-2 text-sm font-medium transition-all ${
                                            formData.paymentMethod === method
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                    >
                                        {method}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Salary Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="baseSalary" className="font-semibold">Base Salary (Monthly)</Label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        id="baseSalary"
                                        type="number"
                                        value={formData.baseSalary}
                                        onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
                                        className="pl-10"
                                        placeholder="50000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="ctc" className="font-semibold">CTC (Per Annum)</Label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        id="ctc"
                                        type="number"
                                        value={formData.ctc}
                                        onChange={(e) => setFormData({ ...formData, ctc: Number(e.target.value) })}
                                        className="pl-10"
                                        placeholder="800000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="hra" className="font-semibold">HRA</Label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        id="hra"
                                        type="number"
                                        value={formData.hra}
                                        onChange={(e) => setFormData({ ...formData, hra: Number(e.target.value) })}
                                        className="pl-10"
                                        placeholder="20000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="da" className="font-semibold">Dearness Allowance</Label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        id="da"
                                        type="number"
                                        value={formData.da}
                                        onChange={(e) => setFormData({ ...formData, da: Number(e.target.value) })}
                                        className="pl-10"
                                        placeholder="5000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="specialAllowance" className="font-semibold">Special Allowance</Label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        id="specialAllowance"
                                        type="number"
                                        value={formData.specialAllowance}
                                        onChange={(e) => setFormData({ ...formData, specialAllowance: Number(e.target.value) })}
                                        className="pl-10"
                                        placeholder="10000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="variablePay" className="font-semibold">Variable Pay</Label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        id="variablePay"
                                        type="number"
                                        value={formData.variablePay}
                                        onChange={(e) => setFormData({ ...formData, variablePay: Number(e.target.value) })}
                                        className="pl-10"
                                        placeholder="5000"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsEditing(false);
                                    loadFinancials(); // Reset form
                                }}
                            >
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={loading}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                <Save className="w-4 h-4 mr-1" />
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {financials ? (
                            <>
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                                        <p className="text-xs text-emerald-600 font-medium">Salary Mode</p>
                                        <p className="text-lg font-bold text-emerald-700">{financials.salaryMode}</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                                        <p className="text-xs text-blue-600 font-medium">Payment Method</p>
                                        <p className="text-lg font-bold text-blue-700">{financials.paymentMethod}</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                                        <p className="text-xs text-purple-600 font-medium">Base Salary</p>
                                        <p className="text-lg font-bold text-purple-700">{formatCurrency(financials.baseSalary)}</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                                        <p className="text-xs text-orange-600 font-medium">CTC (Annual)</p>
                                        <p className="text-lg font-bold text-orange-700">{formatCurrency(financials.ctc)}</p>
                                    </div>
                                </div>

                                {/* Salary Breakdown */}
                                <div className="p-4 rounded-lg bg-gray-50 border">
                                    <h4 className="font-semibold text-gray-700 mb-4">Salary Breakdown</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {financials.hra && financials.hra > 0 && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">HRA</span>
                                                <span className="font-medium">{formatCurrency(financials.hra)}</span>
                                            </div>
                                        )}
                                        {financials.da && financials.da > 0 && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">DA</span>
                                                <span className="font-medium">{formatCurrency(financials.da)}</span>
                                            </div>
                                        )}
                                        {financials.specialAllowance && financials.specialAllowance > 0 && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Special Allowance</span>
                                                <span className="font-medium">{formatCurrency(financials.specialAllowance)}</span>
                                            </div>
                                        )}
                                        {financials.variablePay && financials.variablePay > 0 && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Variable Pay</span>
                                                <span className="font-medium">{formatCurrency(financials.variablePay)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <Wallet className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500">No payment information available</p>
                                {!readOnly && (
                                    <Button
                                        className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        <Edit className="w-4 h-4 mr-1" />
                                        Add Payment Info
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
