import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import OfflineBanner from '../pwa/OfflineBanner';
import PwaUpdatePrompt from '../pwa/PwaUpdatePrompt';
import PwaInstallPrompt from '../pwa/PwaInstallPrompt';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

import NotificationBell from './NotificationBell';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden">
            {/* Mobile Sidebar Backdrop */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                {/* Global Offline Status Banner */}
                <OfflineBanner />

                {/* Mobile Header */}
                <header className="lg:hidden h-16 flex items-center justify-between px-4 sm:px-6 bg-slate-900 border-b border-slate-800 flex-shrink-0">
                    <div className="flex items-center">
                        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
                            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="ml-3 font-bold text-white tracking-tight">CarShop</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Notification Bell (Mobile) */}
                        <NotificationBell />
                        {/* Compact Install Button in Mobile Header */}
                        <PwaInstallPrompt variant="compact" />
                        <button 
                            type="button"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
                            aria-label="Toggle menu"
                        >
                            {sidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                        </button>
                    </div>
                </header>

                {/* Desktop Top Bar */}
                <header className="hidden lg:flex h-16 items-center justify-between px-8 bg-slate-900/60 backdrop-blur-sm border-b border-slate-800 flex-shrink-0">
                    <div className="flex items-center text-xs text-slate-400">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 mr-2.5 animate-pulse" />
                        <span className="font-medium text-slate-300">CarShop ERP Active</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <PwaInstallPrompt variant="compact" />
                        <NotificationBell />
                    </div>
                </header>

                {/* Main Content Area with padding for mobile bottom navigation */}
                <main className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-8 pb-20 lg:pb-8">
                    <Outlet />
                </main>

                {/* Mobile Bottom Navigation Bar (< lg screens) */}
                <MobileBottomNav onOpenMenu={() => setSidebarOpen(true)} />

                {/* PWA Update Toast/Prompt */}
                <PwaUpdatePrompt />
            </div>
        </div>
    );
};

export default Layout;
