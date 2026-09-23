import { useState } from 'react';
import usePwaInstall from '../../hooks/usePwaInstall';
import { ArrowDownTrayIcon, ShareIcon, XMarkIcon } from '@heroicons/react/24/outline';

const PwaInstallPrompt = ({ variant = 'button' }) => {
    const { canInstall, isInstalled, isIos, promptInstall } = usePwaInstall();
    const [showIosModal, setShowIosModal] = useState(false);

    if (isInstalled) {
        return null;
    }

    if (!canInstall && !isIos) {
        return null;
    }

    const handleClick = () => {
        if (isIos) {
            setShowIosModal(true);
        } else {
            promptInstall();
        }
    };

    return (
        <>
            {variant === 'sidebar' ? (
                <div className="p-3 mx-3 my-2 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-xl">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                            <ArrowDownTrayIcon className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white">Install Carshop</p>
                            <p className="text-[10px] text-slate-400">Fast native app experience</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClick}
                        className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition-all"
                    >
                        Install App
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={handleClick}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 rounded-lg text-xs font-medium transition-all"
                    title="Install Carshop PWA"
                >
                    <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                    <span>Install App</span>
                </button>
            )}

            {/* iOS Step-by-Step Instructions Modal */}
            {showIosModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 text-white shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-sm">Install on iPhone / iPad</h3>
                            </div>
                            <button
                                onClick={() => setShowIosModal(false)}
                                className="text-slate-400 hover:text-white p-1"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <p className="text-xs text-slate-300 mb-4">
                            Install Carshop to your Home Screen for full screen and quick access:
                        </p>

                        <ol className="space-y-3 text-xs text-slate-300">
                            <li className="flex items-start gap-2.5">
                                <span className="h-5 w-5 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">1</span>
                                <span>Tap the <strong>Share</strong> button <ShareIcon className="h-3.5 w-3.5 inline text-blue-400" /> at the bottom of Safari.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="h-5 w-5 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">2</span>
                                <span>Scroll down and select <strong>Add to Home Screen</strong>.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="h-5 w-5 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">3</span>
                                <span>Tap <strong>Add</strong> in the top-right corner.</span>
                            </li>
                        </ol>

                        <button
                            type="button"
                            onClick={() => setShowIosModal(false)}
                            className="mt-5 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all"
                        >
                            Got It
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default PwaInstallPrompt;
