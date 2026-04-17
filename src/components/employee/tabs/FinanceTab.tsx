/**
 * Finance Tab for Employee Profile
 * Complete financial information including salary, bank, PF, and documents
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PaymentInfo from '@/components/hrms/finance/PaymentInfo';
import BankDetails from '@/components/hrms/finance/BankDetails';
import PFDetails from '@/components/hrms/finance/PFDetails';
import IdentityDocuments from '@/components/hrms/finance/IdentityDocuments';
import { useAuth } from '@/context/AuthContext';

interface FinanceTabProps {
    employeeId?: string;
}

export default function FinanceTab({ employeeId }: FinanceTabProps) {
    const { user } = useAuth();

    // Determine if the current user can edit (admin or viewing own profile)
    const canEdit = user?.role === 'admin' || user?.id === employeeId;

    return (
        <div className="space-y-6">
            <Tabs defaultValue="payment" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-gray-100">
                    <TabsTrigger value="payment" className="data-[state=active]:bg-white">
                        💰 Payment
                    </TabsTrigger>
                    <TabsTrigger value="bank" className="data-[state=active]:bg-white">
                        🏦 Bank
                    </TabsTrigger>
                    <TabsTrigger value="pf" className="data-[state=active]:bg-white">
                        🏛️ PF/Statutory
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="data-[state=active]:bg-white">
                        📄 Documents
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="payment" className="mt-6">
                    <PaymentInfo employeeId={employeeId} readOnly={!canEdit} />
                </TabsContent>

                <TabsContent value="bank" className="mt-6">
                    <BankDetails employeeId={employeeId} readOnly={!canEdit} />
                </TabsContent>

                <TabsContent value="pf" className="mt-6">
                    <PFDetails employeeId={employeeId} readOnly={!canEdit} />
                </TabsContent>

                <TabsContent value="documents" className="mt-6">
                    <IdentityDocuments employeeId={employeeId} readOnly={!canEdit} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
