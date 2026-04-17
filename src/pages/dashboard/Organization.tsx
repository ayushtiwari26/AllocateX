/**
 * Organization Page
 * Interactive org graph (React Flow + dagre auto-layout).
 */

import OrgFlowChart from '@/components/organization/OrgFlowChart';

export default function OrganizationPage() {
    return (
        <div className="h-full">
            <OrgFlowChart />
        </div>
    );
}
