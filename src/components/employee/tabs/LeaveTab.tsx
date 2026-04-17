/**
 * Leave Tab for Employee Profile
 * Combines leave request, calendar, approval, and notifications for team leads
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LeaveRequestForm from '@/components/hrms/leave/LeaveRequestForm';
import LeaveCalendar from '@/components/hrms/leave/LeaveCalendar';
import LeaveApproval from '@/components/hrms/leave/LeaveApproval';
import LeaveNotificationPopup from '@/components/hrms/leave/LeaveNotificationPopup';
import { useAuth } from '@/context/AuthContext';

export default function LeaveTab() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('request');

    const canApprove = user?.role === 'admin' || user?.role === 'Project Manager' || user?.role === 'CTO' || user?.role === 'Team Lead';

    return (
        <div className="relative">
            {/* Notification popup for team leads */}
            {canApprove && (
                <div className="absolute right-0 top-0 z-10">
                    <LeaveNotificationPopup />
                </div>
            )}
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="request">Apply Leave</TabsTrigger>
                    <TabsTrigger value="calendar">My Calendar</TabsTrigger>
                    {canApprove && <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>}
                </TabsList>

                <TabsContent value="request" className="space-y-6">
                    <LeaveRequestForm onSuccess={() => setActiveTab('calendar')} />
                </TabsContent>

                <TabsContent value="calendar">
                    <LeaveCalendar />
                </TabsContent>

                {canApprove && (
                    <TabsContent value="approvals">
                        <LeaveApproval />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
