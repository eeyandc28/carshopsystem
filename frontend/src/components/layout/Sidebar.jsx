import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { 
    HomeIcon, 
    UserGroupIcon, 
    TruckIcon, 
    ClipboardDocumentListIcon, 
    ArchiveBoxIcon, 
    ArrowLeftOnRectangleIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon, roles: ['admin', 'service_advisor', 'mechanic'] },
    { name: 'Customers', href: '/customers', icon: UserGroupIcon, roles: ['admin', 'service_advisor'] },
    { name: 'Vehicles', href: '/vehicles', icon: TruckIcon, roles: ['admin', 'service_advisor'] },
    { name: 'Job Orders', href: '/job-orders', icon: ClipboardDocumentListIcon, roles: ['admin', 'service_advisor', 'mechanic'] },
    { name: 'Inventory', href: '/inventory', icon: ArchiveBoxIcon, roles: ['admin', 'service_advisor'] },
    { name: 'Reports', href: '/reports/sales', icon: ChartBarIcon, roles: ['admin'] },
    { name: 'Users', href: '/users', icon: Cog6ToothIcon, roles: ['admin'] },
];

const Sidebar = ({ onClose }) => {
    const location = useLocation();
    const { logout, user } = useAuthStore();

    const filteredNavigation = navigation.filter(item => 
        item.roles.includes(user?.role || 'service_advisor')
    );

    return (
        <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
            <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
                <div className="flex items-center">
                    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <span className="ml-3 text-lg font-bold text-white tracking-tight">CarShop ERP</span>
                </div>
                <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-white">
                    <XMarkIcon className="h-6 w-6" />
                </button>
            </div>
            
            <div className="flex-1 flex flex-col overflow-y-auto py-4">
                <nav className="flex-1 px-3 space-y-1">
                    {filteredNavigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={onClose}
                                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
                                    isActive 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                            >
                                <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center px-2 py-3 mb-4">
                    <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 font-bold">
                        {user?.name?.[0] || 'A'}
                    </div>
                    <div className="ml-3 overflow-hidden">
                        <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin User'}</p>
                        <p className="text-xs text-slate-500 truncate capitalize">{user?.role || 'administrator'}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all"
                >
                    <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5" />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
