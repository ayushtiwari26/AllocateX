/**
 * Organization Page
 * Displays the company hierarchy with drag-and-drop team management
 */

import OrganizationGraph from '@/components/organization/OrganizationGraph';

export default function OrganizationPage() {
    return (
        <div className="h-full">
            <OrganizationGraph />
        </div>
    );
}
