import { useState, useEffect } from 'react';
import { onServiceWorkerUpdate, skipWaitingAndReload } from '../../services/swRegister';
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';

const PwaUpdatePrompt = () => {
    const [waitingReg, setWaitingReg] = useState(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const unsubscribe = onServiceWorkerUpdate((registration) => {
            setWaitingReg(registration);
            setDismissed(false);
        });
        return unsubscribe;
    }, []);

    if (!waitingReg || dismissed) {
        return null;
    }

    return (
        <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-md z-50 bg-slate-900 border border-blue-500/40 rounded-2xl p-4 shadow-2xl shadow-blue-500/10 text-white backdrop-blur-md">
            <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 text-blue-400">
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white">New Version Available</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                        An update for Carshop is ready. Update now to load the latest features.
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                        <button
                            type="button"
                            onClick={() => skipWaitingAndReload(waitingReg)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all"
                        >
                            Update Now
                        </button>
                        <button
                            type="button"
                            onClick={() => setDismissed(true)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-all"
                        >
                            Later
                        </button>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setDismissed(true)}
                    className="p-1 text-slate-500 hover:text-white transition-colors"
                >
                    <XMarkIcon className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

export default PwaUpdatePrompt;
