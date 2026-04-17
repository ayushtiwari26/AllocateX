
import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Users, FolderOpen, Settings, LogOut, FileBarChart, GitBranch, MessageSquare, Menu, X, UsersRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function DashboardLayout() {
    const { user, organisation, logout } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const displayName = (user as any)?.fullName || (user as any)?.displayName || user?.email || 'Member';
    const initials = displayName
        .split(' ')
        .filter(Boolean)
        .map(part => part[0]?.toUpperCase())
        .join('')
        .slice(0, 2) || 'A';

    const isActive = (path: string) => location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            {/* Mobile Header */}
            <div className="fixed top-0 left-0 right-0 h-14 bg-[#0F1419] text-white flex items-center justify-between px-4 lg:hidden z-40">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-sm">
                        {organisation?.name?.charAt(0) || 'A'}
                    </div>
                    <h1 className="font-bold text-sm truncate max-w-[150px]">{organisation?.name || 'Workspace'}</h1>
                </div>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                    {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-[#0F1419] text-white flex flex-col
                transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                lg:transform-none
            `}>
                <div className="p-6 border-b border-gray-800 hidden lg:block">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold">
                            {organisation?.name?.charAt(0) || 'A'}
                        </div>
                        <div>
                            <h1 className="font-bold text-sm truncate w-32">{organisation?.name || 'Workspace'}</h1>
                            <p className="text-xs text-gray-400">Workspace</p>
                        </div>
                    </div>
                </div>

                {/* Mobile sidebar header spacer */}
                <div className="h-14 lg:hidden" />

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label="Overview" active={location.pathname === '/dashboard'} onClick={closeSidebar} />
                    <NavItem to="/dashboard/employees" icon={<Users size={20} />} label="Employees" active={isActive('/dashboard/employees')} onClick={closeSidebar} />
                    <NavItem to="/dashboard/projects" icon={<FolderOpen size={20} />} label="Projects" active={isActive('/dashboard/projects')} onClick={closeSidebar} />
                    <NavItem to="/dashboard/organization" icon={<GitBranch size={20} />} label="Organization" active={isActive('/dashboard/organization')} onClick={closeSidebar} />
                    <NavItem to="/dashboard/teams" icon={<UsersRound size={20} />} label="Squads" active={isActive('/dashboard/teams')} onClick={closeSidebar} />
                    <NavItem to="/dashboard/allocation" icon={<Settings size={20} />} label="Resource Allocation" active={isActive('/dashboard/allocation')} onClick={closeSidebar} />
                    <NavItem to="/dashboard/ai-reports" icon={<FileBarChart size={20} />} label="AI Reports" active={isActive('/dashboard/ai-reports')} onClick={closeSidebar} />
                    <NavItem to="/dashboard/chat" icon={<MessageSquare size={20} />} label="AI Chat" active={isActive('/dashboard/chat')} onClick={closeSidebar} />
                    <NavItem to="/dashboard/settings" icon={<Settings size={20} />} label="Settings" active={isActive('/dashboard/settings')} onClick={closeSidebar} />
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center gap-3 mb-4 px-3">
                        <Avatar className="h-9 w-9 border border-gray-700 bg-gray-700 text-white flex-shrink-0">
                            <AvatarImage src={(user as any)?.avatar} alt={displayName} />
                            <AvatarFallback className="bg-gray-700 text-white text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{displayName}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { logout(); closeSidebar(); }}
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                    >
                        <LogOut size={16} className="mr-2" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto pt-14 lg:pt-0">
                <Outlet />
            </main>
        </div>
    );
}

function NavItem({ to, icon, label, active, onClick }: { to: string, icon: React.ReactNode, label: string, active: boolean, onClick?: () => void }) {
    return (
        <Link
            to={to}
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${active
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
        >
            {icon}
            <span className="text-sm font-medium">{label}</span>
        </Link>
    )
}
