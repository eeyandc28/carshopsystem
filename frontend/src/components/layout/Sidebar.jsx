import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import usePermission, { getUserRoles } from '../../hooks/usePermission';
import { 
    HomeIcon, 
    UserGroupIcon, 
    TruckIcon, 
    ClipboardDocumentListIcon, 
    ArchiveBoxIcon, 
    ArrowLeftOnRectangleIcon,
    ChartBarIcon,
    ArrowTrendingUpIcon,
    InboxArrowDownIcon,
    Cog6ToothIcon,
    XMarkIcon,
    BanknotesIcon,
    ShieldCheckIcon,
    ClockIcon,
    UserIcon,
    TagIcon,
    WrenchScrewdriverIcon,
    BellIcon
} from '@heroicons/react/24/outline';
import PwaInstallPrompt from '../pwa/PwaInstallPrompt';
import NotificationSettingsModal from '../pwa/NotificationSettingsModal';

const navigation = [
    { name: 'Dashboard',     href: '/',                      icon: HomeIcon,                 permission: 'dashboard.view', roles: ['admin', 'super_admin', 'service_advisor', 'mechanic', 'cashier', 'inventory_staff', 'general_manager', 'sales_staff', 'accountant', 'receptionist'] },
    { name: 'Cashier',       href: '/cashier',               icon: BanknotesIcon,            permission: 'payments.view',  roles: ['admin', 'super_admin', 'cashier', 'accountant', 'general_manager'], group: 'Payments' },
    { name: 'Customers',     href: '/customers',             icon: UserGroupIcon,            permission: 'customers.view', roles: ['admin', 'super_admin', 'service_advisor', 'receptionist', 'sales_staff', 'general_manager'] },
    { name: 'Vehicles',      href: '/vehicles',              icon: TruckIcon,                permission: 'vehicles.view',  roles: ['admin', 'super_admin', 'service_advisor', 'receptionist', 'sales_staff', 'general_manager'] },
    { name: 'Job Orders',    href: '/job-orders',            icon: ClipboardDocumentListIcon, permission: 'job_orders.view', roles: ['admin', 'super_admin', 'service_advisor', 'mechanic', 'cashier', 'general_manager'] },
    { name: 'Services',      href: '/services',              icon: WrenchScrewdriverIcon,     permission: 'job_orders.view', roles: ['admin', 'super_admin', 'service_advisor', 'mechanic', 'cashier', 'general_manager'] },
    { name: 'Inventory',       href: '/inventory',        icon: ArchiveBoxIcon,           permission: 'inventory.view',     roles: ['admin', 'super_admin', 'service_advisor', 'inventory_staff', 'general_manager'] },
    { name: 'Item Types',      href: '/inventory-types',  icon: TagIcon,                  permission: 'inventory.view',     roles: ['admin', 'super_admin', 'inventory_staff', 'general_manager'] },
    { name: 'Suppliers',       href: '/suppliers',        icon: TruckIcon,                permission: 'suppliers.view',     roles: ['admin', 'super_admin', 'service_advisor', 'inventory_staff', 'general_manager'] },
    { name: 'Deliveries',    href: '/deliveries',            icon: InboxArrowDownIcon,       permission: 'inventory.stock_in', roles: ['admin', 'super_admin', 'service_advisor', 'inventory_staff', 'general_manager'], group: 'Purchasing' },
    { name: 'Sales Report',  href: '/reports/sales',         icon: ChartBarIcon,             permission: 'reports.sales',  roles: ['admin', 'super_admin', 'cashier', 'general_manager', 'accountant'], group: 'Reports' },
    { name: 'Daily Income',  href: '/reports/daily-income',  icon: BanknotesIcon,            permission: 'reports.financial', roles: ['admin', 'super_admin', 'cashier', 'accountant', 'general_manager'], group: 'Reports' },
    { name: 'Item Movement', href: '/reports/item-movement', icon: ArrowTrendingUpIcon,      permission: 'reports.inventory', roles: ['admin', 'super_admin', 'inventory_staff', 'general_manager'], group: 'Reports' },
    
    // Administration Group
    { name: 'User Accounts', href: '/users',                 icon: UserIcon,                 permission: 'users.view',     roles: ['admin', 'super_admin'], group: 'Administration' },
    { name: 'Roles & Access', href: '/roles',                icon: ShieldCheckIcon,          permission: 'roles.view',     roles: ['admin', 'super_admin'], group: 'Administration' },
    { name: 'Audit Logs',    href: '/audit-logs',            icon: ClockIcon,                permission: 'audit_logs.view', roles: ['admin', 'super_admin'], group: 'Administration' },
];

const Sidebar = ({ onClose }) => {
    const location = useLocation();
    const { logout, user } = useAuthStore();
    const { hasPermission, isSuperAdmin, userRoles } = usePermission();
    const [notificationModalOpen, setNotificationModalOpen] = useState(false);

    const activeRoles = userRoles && userRoles.length > 0 ? userRoles : getUserRoles(user);
    const isCashier = activeRoles.some(r => r.includes('cashier')) || 
                      (typeof user?.role === 'string' && user.role.toLowerCase().includes('cashier')) ||
                      (user?.email && user.email.toLowerCase().includes('cashier'));

    const filteredNavigation = navigation.filter(item => {
        if (isSuperAdmin) return true;
        if (isCashier && ['/cashier', '/', '/job-orders', '/reports/sales', '/reports/daily-income'].includes(item.href)) {
            return true;
        }
        if (item.permission && hasPermission(item.permission)) return true;

        if (item.roles && item.roles.some(r => activeRoles.includes(r.toLowerCase()))) {
            return true;
        }

        return false;
    });




    // Group items that share a group label
    const navGroups = filteredNavigation.reduce((acc, item) => {
        const key = item.group || '__none__';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

    return (
        <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
                <div className="flex items-center">
                    <img 
                        src="/logo.png" 
                        alt="RADI8" 
                        className="h-9 w-auto rounded-lg object-contain shadow-md border border-slate-700/50" 
                    />
                    <div className="ml-2.5">
                        <span className="text-base font-black text-white tracking-tight block leading-none">RADI8</span>
                        <span className="text-[9px] font-semibold text-red-500 uppercase tracking-wider block mt-0.5">Precision Auto</span>
                    </div>
                </div>
                <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-white">
                    <XMarkIcon className="h-6 w-6" />
                </button>
            </div>
            
            <div className="flex-1 flex flex-col overflow-y-auto py-4">
                <nav className="flex-1 px-3 space-y-1">
                    {Object.entries(navGroups).map(([group, items]) => (
                        <div key={group}>
                            {group !== '__none__' && (
                                <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-600">{group}</p>
                            )}
                            {items.map((item) => {
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
                        </div>
                    ))}
                </nav>
            </div>

            <div className="p-4 border-t border-slate-800">
                <button
                    type="button"
                    onClick={() => setNotificationModalOpen(true)}
                    className="w-full flex items-center px-3 py-2 mb-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                >
                    <BellIcon className="mr-3 h-5 w-5 text-slate-500" />
                    Push Notifications
                </button>
                <PwaInstallPrompt variant="sidebar" />
                <div className="flex items-center px-2 py-3 mb-2">
                    <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 font-bold">
                        {user?.name?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div className="ml-3 overflow-hidden">
                        <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin User'}</p>
                        <p className="text-xs text-slate-500 truncate capitalize">
                            {user?.role_names?.join(', ') || user?.role?.replace('_', ' ') || 'administrator'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all"
                >
                    <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5" />
                    Sign Out
                </button>
                <div className="mt-3 text-center">
                    <span className="text-[10px] font-mono text-slate-500 tracking-wider">RADI8 v1.0.0</span>
                </div>
            </div>

            <NotificationSettingsModal
                isOpen={notificationModalOpen}
                onClose={() => setNotificationModalOpen(false)}
            />
        </div>
    );
};

export default Sidebar;
