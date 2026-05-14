import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

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
                {/* Mobile Header */}
                <header className="lg:hidden h-16 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800">
                    <div className="flex items-center">
                        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="ml-3 font-bold text-white tracking-tight">CarShop</span>
                    </div>
                    <button 
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 text-slate-400 hover:text-white"
                    >
                        {sidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
