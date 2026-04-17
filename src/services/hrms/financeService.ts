/**
 * Mock Finance Service
 * Handles employee financial, bank, PF, ESI, PT details and documents
 */

import {
    EmployeeFinancials,
    EmployeeBankDetails,
    EmployeePFDetails,
    EmployeeESIDetails,
    EmployeePTDetails,
    EmployeeIdentityDoc,
    DocumentValidation,
    DocumentType
} from '@/types/hrms';

const FINANCIALS_KEY = 'allocx_employee_financials';
const BANK_DETAILS_KEY = 'allocx_employee_bank_details';
const PF_DETAILS_KEY = 'allocx_employee_pf_details';
const ESI_DETAILS_KEY = 'allocx_employee_esi_details';
const PT_DETAILS_KEY = 'allocx_employee_pt_details';
const IDENTITY_DOCS_KEY = 'allocx_employee_identity_docs';

const MANDATORY_DOCUMENTS: DocumentType[] = ['PAN', 'Aadhaar', 'Photo ID'];

export const financeService = {
    // ==================== FINANCIAL INFO ====================

    /**
     * Get employee financials
     */
    getFinancials(employeeId: string): EmployeeFinancials | null {
        const financials: EmployeeFinancials[] = JSON.parse(localStorage.getItem(FINANCIALS_KEY) || '[]');
        return financials.find(f => f.employeeId === employeeId) || null;
    },

    /**
     * Create/Update employee financials
     */
    saveFinancials(data: Omit<EmployeeFinancials, 'id' | 'createdAt' | 'updatedAt'>): EmployeeFinancials {
        console.log('[Finance] Saving financials for:', data.employeeId);

        const financials: EmployeeFinancials[] = JSON.parse(localStorage.getItem(FINANCIALS_KEY) || '[]');
        const existing = financials.findIndex(f => f.employeeId === data.employeeId);

        const financial: EmployeeFinancials = {
            ...data,
            id: existing >= 0 ? financials[existing].id : `fin-${Date.now()}`,
            createdAt: existing >= 0 ? financials[existing].createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (existing >= 0) {
            financials[existing] = financial;
        } else {
            financials.push(financial);
        }

        localStorage.setItem(FINANCIALS_KEY, JSON.stringify(financials));
        return financial;
    },

    // ==================== BANK DETAILS ====================

    /**
     * Get bank details
     */
    getBankDetails(employeeId: string): EmployeeBankDetails | null {
        const details: EmployeeBankDetails[] = JSON.parse(localStorage.getItem(BANK_DETAILS_KEY) || '[]');
        return details.find(d => d.employeeId === employeeId) || null;
    },

    /**
     * Save bank details
     */
    saveBankDetails(data: Omit<EmployeeBankDetails, 'id' | 'createdAt' | 'updatedAt'>): EmployeeBankDetails {
        console.log('[Finance] Saving bank details for:', data.employeeId);

        const allDetails: EmployeeBankDetails[] = JSON.parse(localStorage.getItem(BANK_DETAILS_KEY) || '[]');
        const existing = allDetails.findIndex(d => d.employeeId === data.employeeId);

        const bankDetail: EmployeeBankDetails = {
            ...data,
            id: existing >= 0 ? allDetails[existing].id : `bank-${Date.now()}`,
            createdAt: existing >= 0 ? allDetails[existing].createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (existing >= 0) {
            allDetails[existing] = bankDetail;
        } else {
            allDetails.push(bankDetail);
        }

        localStorage.setItem(BANK_DETAILS_KEY, JSON.stringify(allDetails));
        return bankDetail;
    },

    /**
     * Verify bank details
     */
    verifyBankDetails(employeeId: string): EmployeeBankDetails {
        const details = this.getBankDetails(employeeId);
        if (!details) throw new Error('Bank details not found');

        details.isVerified = true;
        details.updatedAt = new Date().toISOString();

        const allDetails: EmployeeBankDetails[] = JSON.parse(localStorage.getItem(BANK_DETAILS_KEY) || '[]');
        const index = allDetails.findIndex(d => d.employeeId === employeeId);
        allDetails[index] = details;
        localStorage.setItem(BANK_DETAILS_KEY, JSON.stringify(allDetails));

        return details;
    },

    // ==================== PF DETAILS ====================

    /**
     * Get PF details
     */
    getPFDetails(employeeId: string): EmployeePFDetails | null {
        const details: EmployeePFDetails[] = JSON.parse(localStorage.getItem(PF_DETAILS_KEY) || '[]');
        return details.find(d => d.employeeId === employeeId) || null;
    },

    /**
     * Save PF details
     */
    savePFDetails(data: Omit<EmployeePFDetails, 'id' | 'createdAt' | 'updatedAt'>): EmployeePFDetails {
        console.log('[Finance] Saving PF details for:', data.employeeId);

        const allDetails: EmployeePFDetails[] = JSON.parse(localStorage.getItem(PF_DETAILS_KEY) || '[]');
        const existing = allDetails.findIndex(d => d.employeeId === data.employeeId);

        const pfDetail: EmployeePFDetails = {
            ...data,
            id: existing >= 0 ? allDetails[existing].id : `pf-${Date.now()}`,
            createdAt: existing >= 0 ? allDetails[existing].createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (existing >= 0) {
            allDetails[existing] = pfDetail;
        } else {
            allDetails.push(pfDetail);
        }

        localStorage.setItem(PF_DETAILS_KEY, JSON.stringify(allDetails));
        return pfDetail;
    },

    // ==================== ESI DETAILS ====================

    /**
     * Get ESI details
     */
    getESIDetails(employeeId: string): EmployeeESIDetails | null {
        const details: EmployeeESIDetails[] = JSON.parse(localStorage.getItem(ESI_DETAILS_KEY) || '[]');
        return details.find(d => d.employeeId === employeeId) || null;
    },

    /**
     * Save ESI details
     */
    saveESIDetails(data: Omit<EmployeeESIDetails, 'id' | 'createdAt' | 'updatedAt'>): EmployeeESIDetails {
        console.log('[Finance] Saving ESI details for:', data.employeeId);

        const allDetails: EmployeeESIDetails[] = JSON.parse(localStorage.getItem(ESI_DETAILS_KEY) || '[]');
        const existing = allDetails.findIndex(d => d.employeeId === data.employeeId);

        const esiDetail: EmployeeESIDetails = {
            ...data,
            id: existing >= 0 ? allDetails[existing].id : `esi-${Date.now()}`,
            createdAt: existing >= 0 ? allDetails[existing].createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (existing >= 0) {
            allDetails[existing] = esiDetail;
        } else {
            allDetails.push(esiDetail);
        }

        localStorage.setItem(ESI_DETAILS_KEY, JSON.stringify(allDetails));
        return esiDetail;
    },

    // ==================== PT DETAILS ====================

    /**
     * Get PT details
     */
    getPTDetails(employeeId: string): EmployeePTDetails | null {
        const details: EmployeePTDetails[] = JSON.parse(localStorage.getItem(PT_DETAILS_KEY) || '[]');
        return details.find(d => d.employeeId === employeeId) || null;
    },

    /**
     * Save PT details
     */
    savePTDetails(data: Omit<EmployeePTDetails, 'id' | 'createdAt' | 'updatedAt'>): EmployeePTDetails {
        console.log('[Finance] Saving PT details for:', data.employeeId);

        const allDetails: EmployeePTDetails[] = JSON.parse(localStorage.getItem(PT_DETAILS_KEY) || '[]');
        const existing = allDetails.findIndex(d => d.employeeId === data.employeeId);

        const ptDetail: EmployeePTDetails = {
            ...data,
            id: existing >= 0 ? allDetails[existing].id : `pt-${Date.now()}`,
            createdAt: existing >= 0 ? allDetails[existing].createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (existing >= 0) {
            allDetails[existing] = ptDetail;
        } else {
            allDetails.push(ptDetail);
        }

        localStorage.setItem(PT_DETAILS_KEY, JSON.stringify(allDetails));
        return ptDetail;
    },

    // ==================== IDENTITY DOCUMENTS ====================

    /**
     * Get all documents for employee
     */
    getDocuments(employeeId: string): EmployeeIdentityDoc[] {
        const docs: EmployeeIdentityDoc[] = JSON.parse(localStorage.getItem(IDENTITY_DOCS_KEY) || '[]');
        return docs.filter(d => d.employeeId === employeeId);
    },

    /**
     * Upload document
     */
    uploadDocument(data: Omit<EmployeeIdentityDoc, 'id' | 'uploadedAt'>): EmployeeIdentityDoc {
        console.log('[Finance] Uploading document:', data.documentType, 'for:', data.employeeId);

        const doc: EmployeeIdentityDoc = {
            ...data,
            id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            uploadedAt: new Date().toISOString()
        };

        const docs = JSON.parse(localStorage.getItem(IDENTITY_DOCS_KEY) || '[]');
        docs.push(doc);
        localStorage.setItem(IDENTITY_DOCS_KEY, JSON.stringify(docs));

        return doc;
    },

    /**
     * Verify document
     */
    verifyDocument(documentId: string, verifiedBy: string): EmployeeIdentityDoc {
        const docs: EmployeeIdentityDoc[] = JSON.parse(localStorage.getItem(IDENTITY_DOCS_KEY) || '[]');
        const doc = docs.find(d => d.id === documentId);

        if (!doc) throw new Error('Document not found');

        doc.isVerified = true;
        doc.verifiedAt = new Date().toISOString();
        doc.verifiedBy = verifiedBy;

        localStorage.setItem(IDENTITY_DOCS_KEY, JSON.stringify(docs));
        return doc;
    },

    /**
     * Delete document
     */
    deleteDocument(documentId: string): boolean {
        const docs: EmployeeIdentityDoc[] = JSON.parse(localStorage.getItem(IDENTITY_DOCS_KEY) || '[]');
        const filtered = docs.filter(d => d.id !== documentId);

        if (filtered.length === docs.length) {
            return false; // Document not found
        }

        localStorage.setItem(IDENTITY_DOCS_KEY, JSON.stringify(filtered));
        return true;
    },

    /**
     * Validate documents for employee
     */
    validateDocuments(employeeId: string): DocumentValidation[] {
        const docs = this.getDocuments(employeeId);

        const validations: DocumentValidation[] = MANDATORY_DOCUMENTS.map(docType => {
            const doc = docs.find(d => d.documentType === docType);

            let validationStatus: 'Valid' | 'Invalid' | 'Pending' | 'Missing' = 'Missing';
            let errorMessage: string | undefined;

            if (doc) {
                if (doc.isVerified) {
                    validationStatus = 'Valid';
                } else {
                    validationStatus = 'Pending';
                    errorMessage = 'Document verification pending';
                }

                // Check expiry
                if (doc.expiryDate && new Date(doc.expiryDate) < new Date()) {
                    validationStatus = 'Invalid';
                    errorMessage = 'Document has expired';
                }
            } else {
                errorMessage = `${docType} document is mandatory`;
            }

            return {
                documentType: docType,
                isUploaded: !!doc,
                isVerified: doc?.isVerified || false,
                isMandatory: true,
                validationStatus,
                errorMessage
            };
        });

        return validations;
    },

    /**
     * Get complete employee HRMS finance data
     */
    getCompleteFinanceData(employeeId: string) {
        return {
            financials: this.getFinancials(employeeId),
            bankDetails: this.getBankDetails(employeeId),
            pfDetails: this.getPFDetails(employeeId),
            esiDetails: this.getESIDetails(employeeId),
            ptDetails: this.getPTDetails(employeeId),
            documents: this.getDocuments(employeeId),
            documentValidations: this.validateDocuments(employeeId)
        };
    }
};
