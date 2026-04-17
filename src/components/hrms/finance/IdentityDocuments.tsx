/**
 * Identity Documents Component
 * Manage PAN, Aadhaar, and other identity documents
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { financeService } from '@/services/hrms/financeService';
import { useAuth } from '@/context/AuthContext';
import {
    FileText,
    Upload,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Trash2,
    Eye,
    Clock
} from 'lucide-react';
import type { EmployeeIdentityDoc, DocumentValidation, DocumentType } from '@/types/hrms';

interface IdentityDocumentsProps {
    employeeId?: string;
    readOnly?: boolean;
}

export default function IdentityDocuments({ employeeId, readOnly = false }: IdentityDocumentsProps) {
    const { user } = useAuth();
    const targetEmployeeId = employeeId || user?.id;

    const [documents, setDocuments] = useState<EmployeeIdentityDoc[]>([]);
    const [validations, setValidations] = useState<DocumentValidation[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadData, setUploadData] = useState({
        documentType: 'PAN' as DocumentType,
        documentNumber: '',
        documentUrl: '',
        expiryDate: '',
        notes: ''
    });

    useEffect(() => {
        if (targetEmployeeId) {
            loadDocuments();
        }
    }, [targetEmployeeId]);

    const loadDocuments = () => {
        if (!targetEmployeeId) return;
        const docs = financeService.getDocuments(targetEmployeeId);
        const vals = financeService.validateDocuments(targetEmployeeId);
        setDocuments(docs);
        setValidations(vals);
    };

    const handleUpload = async () => {
        if (!targetEmployeeId) return;

        try {
            // Simulate file upload - in real app, would upload to storage
            const fakeUrl = `https://storage.example.com/docs/${targetEmployeeId}/${uploadData.documentType.toLowerCase()}-${Date.now()}.pdf`;
            
            financeService.uploadDocument({
                employeeId: targetEmployeeId,
                documentType: uploadData.documentType,
                documentNumber: uploadData.documentNumber,
                documentUrl: fakeUrl,
                isVerified: false,
                expiryDate: uploadData.expiryDate || undefined,
                notes: uploadData.notes || undefined
            });

            setIsUploading(false);
            setUploadData({
                documentType: 'PAN',
                documentNumber: '',
                documentUrl: '',
                expiryDate: '',
                notes: ''
            });
            loadDocuments();
        } catch (error) {
            console.error('Error uploading document:', error);
        }
    };

    const handleVerify = (docId: string) => {
        if (!user?.id) return;
        try {
            financeService.verifyDocument(docId, user.id);
            loadDocuments();
        } catch (error) {
            console.error('Error verifying document:', error);
        }
    };

    const handleDelete = (docId: string) => {
        if (confirm('Delete this document?')) {
            financeService.deleteDocument(docId);
            loadDocuments();
        }
    };

    const documentTypes: DocumentType[] = ['PAN', 'Aadhaar', 'Address Proof', 'Photo ID', 'Resume', 'Education Certificate', 'Experience Letter'];

    const getDocumentIcon = (type: DocumentType) => {
        const icons: Record<DocumentType, string> = {
            'PAN': '🪪',
            'Aadhaar': '🆔',
            'Address Proof': '🏠',
            'Photo ID': '📷',
            'Resume': '📄',
            'Education Certificate': '🎓',
            'Experience Letter': '💼'
        };
        return icons[type];
    };

    const getValidationBadge = (validation: DocumentValidation) => {
        const styles = {
            'Valid': 'bg-green-100 text-green-700 border-green-300',
            'Invalid': 'bg-red-100 text-red-700 border-red-300',
            'Pending': 'bg-yellow-100 text-yellow-700 border-yellow-300',
            'Missing': 'bg-gray-100 text-gray-700 border-gray-300'
        };
        const icons = {
            'Valid': <CheckCircle2 className="w-3 h-3" />,
            'Invalid': <XCircle className="w-3 h-3" />,
            'Pending': <Clock className="w-3 h-3" />,
            'Missing': <AlertTriangle className="w-3 h-3" />
        };
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[validation.validationStatus]}`}>
                {icons[validation.validationStatus]}
                {validation.validationStatus}
            </span>
        );
    };

    const maskNumber = (num: string, type: DocumentType) => {
        if (!num || num.length < 4) return num;
        if (type === 'Aadhaar') {
            return 'XXXX XXXX ' + num.slice(-4);
        }
        if (type === 'PAN') {
            return num.substring(0, 2) + 'XXXXX' + num.slice(-4);
        }
        return num;
    };

    return (
        <Card className="border-2">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-600 text-white">
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Identity Documents
                    </div>
                    {!readOnly && !isUploading && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsUploading(true)}
                            className="bg-white/20 hover:bg-white/30"
                        >
                            <Upload className="w-4 h-4 mr-1" />
                            Upload Document
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                {isUploading ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-semibold">Document Type *</Label>
                                <select
                                    value={uploadData.documentType}
                                    onChange={(e) => setUploadData({ ...uploadData, documentType: e.target.value as DocumentType })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                    {documentTypes.map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="documentNumber" className="font-semibold">Document Number *</Label>
                                <Input
                                    id="documentNumber"
                                    value={uploadData.documentNumber}
                                    onChange={(e) => setUploadData({ ...uploadData, documentNumber: e.target.value })}
                                    placeholder="e.g., ABCDE1234F"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="expiryDate" className="font-semibold">Expiry Date (if applicable)</Label>
                                <Input
                                    id="expiryDate"
                                    type="date"
                                    value={uploadData.expiryDate}
                                    onChange={(e) => setUploadData({ ...uploadData, expiryDate: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes" className="font-semibold">Notes</Label>
                                <Input
                                    id="notes"
                                    value={uploadData.notes}
                                    onChange={(e) => setUploadData({ ...uploadData, notes: e.target.value })}
                                    placeholder="Any additional notes"
                                />
                            </div>
                        </div>

                        {/* File Upload Simulation */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                            <p className="text-gray-600 mb-2">Drop your file here or click to browse</p>
                            <p className="text-xs text-gray-400">PDF, JPG, PNG up to 5MB</p>
                            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                            <Button variant="outline" className="mt-3" onClick={() => setUploadData({ ...uploadData, documentUrl: 'file-selected.pdf' })}>
                                Select File
                            </Button>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button variant="outline" onClick={() => setIsUploading(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={!uploadData.documentNumber}
                                className="bg-orange-600 hover:bg-orange-700"
                            >
                                <Upload className="w-4 h-4 mr-1" />
                                Upload Document
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Validation Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {validations.map((val) => (
                                <div
                                    key={val.documentType}
                                    className={`p-3 rounded-lg border ${
                                        val.validationStatus === 'Valid' ? 'bg-green-50 border-green-200' :
                                        val.validationStatus === 'Pending' ? 'bg-yellow-50 border-yellow-200' :
                                        val.validationStatus === 'Missing' ? 'bg-gray-50 border-gray-200' :
                                        'bg-red-50 border-red-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-lg">{getDocumentIcon(val.documentType)}</span>
                                        {getValidationBadge(val)}
                                    </div>
                                    <p className="font-medium text-sm text-gray-800">{val.documentType}</p>
                                    {val.isMandatory && (
                                        <p className="text-xs text-red-500">Required</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Document List */}
                        {documents.length > 0 ? (
                            <div className="space-y-3">
                                <h4 className="font-semibold text-gray-700">Uploaded Documents</h4>
                                {documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{getDocumentIcon(doc.documentType)}</span>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-gray-800">{doc.documentType}</p>
                                                    {doc.isVerified ? (
                                                        <span className="flex items-center gap-1 text-green-600 text-xs">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            Verified
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-yellow-600 text-xs">
                                                            <Clock className="w-3 h-3" />
                                                            Pending
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 font-mono">
                                                    {maskNumber(doc.documentNumber, doc.documentType)}
                                                </p>
                                                {doc.expiryDate && (
                                                    <p className="text-xs text-gray-400">
                                                        Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" className="text-gray-600">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            {!doc.isVerified && user?.role === 'admin' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-green-600"
                                                    onClick={() => handleVerify(doc.id)}
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {!readOnly && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600"
                                                    onClick={() => handleDelete(doc.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-500">
                                <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                                <p>No documents uploaded yet</p>
                            </div>
                        )}

                        {/* Missing Documents Warning */}
                        {validations.some(v => v.isMandatory && v.validationStatus === 'Missing') && (
                            <div className="flex items-start gap-2 p-4 rounded-lg bg-red-50 border border-red-200">
                                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-red-800">Missing Mandatory Documents</p>
                                    <p className="text-sm text-red-600">
                                        Please upload the following: {validations.filter(v => v.isMandatory && v.validationStatus === 'Missing').map(v => v.documentType).join(', ')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
