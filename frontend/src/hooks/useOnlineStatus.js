import { useState, useEffect } from 'react';

export default function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );
    const [backOnline, setBackOnline] = useState(false);

    useEffect(() => {
        let timer = null;

        const handleOnline = () => {
            setIsOnline(true);
            setBackOnline(true);
            timer = setTimeout(() => {
                setBackOnline(false);
            }, 4000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setBackOnline(false);
            if (timer) clearTimeout(timer);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if (timer) clearTimeout(timer);
        };
    }, []);

    return { isOnline, backOnline };
}
