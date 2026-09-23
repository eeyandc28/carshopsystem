import useOnlineStatus from '../../hooks/useOnlineStatus';
import { WifiIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const OfflineBanner = () => {
    const { isOnline, backOnline } = useOnlineStatus();

    if (isOnline && !backOnline) {
        return null;
    }

    if (backOnline) {
        return (
            <div className="bg-emerald-600/90 text-white px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-center gap-2 shadow-md transition-all duration-300">
                <WifiIcon className="h-4 w-4 text-emerald-200" />
                <span>Internet connection restored. You're back online!</span>
            </div>
        );
    }

    return (
        <div className="bg-amber-600/95 text-white px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-center gap-2 shadow-md transition-all duration-300">
            <ExclamationTriangleIcon className="h-4 w-4 text-amber-200 animate-pulse" />
            <span>You are currently offline. Some features may be unavailable.</span>
        </div>
    );
};

export default OfflineBanner;
