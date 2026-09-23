import { Link, useLocation } from 'react-router-dom';
import { 
    HomeIcon, 
    ClipboardDocumentListIcon, 
    TruckIcon, 
    ArchiveBoxIcon, 
    Bars3Icon 
} from '@heroicons/react/24/outline';

const MobileBottomNav = ({ onOpenMenu }) => {
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', href: '/', icon: HomeIcon },
        { name: 'Jobs', href: '/job-orders', icon: ClipboardDocumentListIcon },
        { name: 'Vehicles', href: '/vehicles', icon: TruckIcon },
        { name: 'Inventory', href: '/inventory', icon: ArchiveBoxIcon },
    ];

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1 safe-area-bottom">
            <div className="flex items-center justify-around">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.href || 
                        (item.href !== '/' && location.pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                                isActive 
                                    ? 'text-blue-400 font-semibold' 
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Icon className={`h-5 w-5 ${isActive ? 'text-blue-400 scale-110' : ''} transition-transform`} />
                            <span className="text-[10px] mt-0.5 tracking-tight">{item.name}</span>
                        </Link>
                    );
                })}

                {/* More / Full Menu Trigger */}
                <button
                    type="button"
                    onClick={onOpenMenu}
                    className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-slate-400 hover:text-slate-200 transition-all"
                >
                    <Bars3Icon className="h-5 w-5" />
                    <span className="text-[10px] mt-0.5 tracking-tight">Menu</span>
                </button>
            </div>
        </nav>
    );
};

export default MobileBottomNav;
