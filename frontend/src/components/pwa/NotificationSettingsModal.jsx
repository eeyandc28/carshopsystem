import React, { useState, useEffect } from 'react';
import {
    BellIcon,
    BellSlashIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XMarkIcon,
    PaperAirplaneIcon,
    ShieldExclamationIcon,
    DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';
import {
    isPushNotificationSupported,
    getNotificationPermission,
    checkCurrentSubscription,
    subscribeUserToPush,
    unsubscribeUserFromPush,
    sendTestPushNotification,
    getNotificationPreferences,
    saveNotificationPreferences,
    getDeviceFriendlyName
} from '../../services/pushNotificationService';

const NotificationSettingsModal = ({ isOpen, onClose }) => {
    const [supported, setSupported] = useState(true);
    const [permission, setPermission] = useState('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [testLoading, setTestLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const [preferences, setPreferences] = useState(getNotificationPreferences());
    const deviceName = getDeviceFriendlyName();

    useEffect(() => {
        if (!isOpen) return;

        const isSupp = isPushNotificationSupported();
        setSupported(isSupp);
        setPermission(getNotificationPermission());

        if (isSupp) {
            checkCurrentSubscription().then(sub => {
                setIsSubscribed(!!sub);
            });
        }
        setPreferences(getNotificationPreferences());
        setStatusMessage(null);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleTogglePush = async () => {
        setLoading(true);
        setStatusMessage(null);
        try {
            if (isSubscribed) {
                const ok = await unsubscribeUserFromPush();
                if (ok) {
                    setIsSubscribed(false);
                    setStatusMessage({ type: 'success', text: 'Notifications disabled for this device.' });
                }
            } else {
                const sub = await subscribeUserToPush();
                if (sub) {
                    setIsSubscribed(true);
                    setPermission('granted');
                    setStatusMessage({ type: 'success', text: 'Notifications enabled successfully for this device!' });
                }
            }
        } catch (err) {
            console.error(err);
            setPermission(getNotificationPermission());
            setStatusMessage({ type: 'error', text: err.message || 'Failed to update notification status.' });
        } finally {
            setLoading(false);
        }
    };

    const handleTestNotification = async () => {
        setTestLoading(true);
        setStatusMessage(null);
        try {
            const res = await sendTestPushNotification();
            setStatusMessage({
                type: 'success',
                text: res.message || 'Test push notification sent! Check your device.'
            });
        } catch (err) {
            setStatusMessage({
                type: 'error',
                text: err.message || 'Failed to send test notification.'
            });
        } finally {
            setTestLoading(false);
        }
    };

    const handlePrefChange = (key) => {
        const updated = { ...preferences, [key]: !preferences[key] };
        setPreferences(updated);
        saveNotificationPreferences(updated);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div 
                className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                            <BellIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-tight">Notification Settings</h3>
                            <p className="text-xs text-slate-400">Manage Web Push and CarShop alerts</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                        aria-label="Close"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Status Alert Banner */}
                    {statusMessage && (
                        <div className={`p-3.5 rounded-xl border text-sm flex items-start gap-3 ${
                            statusMessage.type === 'success'
                                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                                : 'bg-red-950/40 border-red-500/30 text-red-300'
                        }`}>
                            {statusMessage.type === 'success' ? (
                                <CheckCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5 text-emerald-400" />
                            ) : (
                                <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-400" />
                            )}
                            <div>{statusMessage.text}</div>
                        </div>
                    )}

                    {/* Permission Status Information */}
                    {!supported ? (
                        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-sm flex items-start gap-3">
                            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">Push notifications are not supported</p>
                                <p className="text-xs text-amber-400/80 mt-1">This browser or device mode does not support the Push API or Service Workers.</p>
                            </div>
                        </div>
                    ) : permission === 'denied' ? (
                        <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-red-300 text-sm flex items-start gap-3">
                            <ShieldExclamationIcon className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-400" />
                            <div>
                                <p className="font-semibold">Notifications are blocked</p>
                                <p className="text-xs text-red-400/80 mt-1">
                                    Notifications are blocked by your browser settings. Please click the site settings icon near the URL bar to allow notifications.
                                </p>
                            </div>
                        </div>
                    ) : null}

                    {/* Master Device Push Subscription Card */}
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-white text-base">Web Push on this Device</span>
                                    {isSubscribed ? (
                                        <span className="px-2 py-0.5 text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            Active
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700 rounded-full">
                                            Disabled
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                                    <DevicePhoneMobileIcon className="h-3.5 w-3.5 text-slate-500" />
                                    Detected: {deviceName}
                                </p>
                                <p className="text-xs text-slate-400">
                                    Receive background alerts for Job Orders, Payments, and Inventory even when the app is closed.
                                </p>
                            </div>

                            <button
                                onClick={handleTogglePush}
                                disabled={loading || !supported || permission === 'denied'}
                                className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md flex-shrink-0 ${
                                    isSubscribed
                                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                                } ${loading || !supported || permission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {loading ? (
                                    <>
                                        <span className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        <span>Updating...</span>
                                    </>
                                ) : isSubscribed ? (
                                    <>
                                        <BellSlashIcon className="h-4 w-4 text-slate-400" />
                                        <span>Disable Device</span>
                                    </>
                                ) : (
                                    <>
                                        <BellIcon className="h-4 w-4" />
                                        <span>Enable Notifications</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Notification Categories Preferences */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Notification Categories
                        </h4>

                        <div className="grid grid-cols-1 gap-2.5">
                            {[
                                { key: 'jobOrders', label: 'Job Orders', desc: 'New orders, assignment, progress and completion' },
                                { key: 'vehicles', label: 'Vehicle Status', desc: 'Inspection done, repair completed, ready for release' },
                                { key: 'quotations', label: 'Quotations', desc: 'New estimates, approvals, and revisions' },
                                { key: 'payments', label: 'Payments', desc: 'Payment received updates and confirmations' },
                                { key: 'inventory', label: 'Inventory & Parts', desc: 'Low stock alerts, parts requests, receiving' },
                                { key: 'appointments', label: 'Appointments', desc: 'Booking updates and schedule reminders' }
                            ].map(({ key, label, desc }) => (
                                <label
                                    key={key}
                                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all"
                                >
                                    <div className="pr-4">
                                        <span className="text-sm font-medium text-slate-200 block">{label}</span>
                                        <span className="text-xs text-slate-500 block">{desc}</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={!!preferences[key]}
                                        onChange={() => handlePrefChange(key)}
                                        className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer"
                                    />
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Safe Test Notification Feature */}
                    <div className="pt-4 border-t border-slate-800/80">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-950/20 border border-blue-500/20 rounded-xl p-4">
                            <div>
                                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <PaperAirplaneIcon className="h-4 w-4 text-blue-400" />
                                    Push Notification Test
                                </h4>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Send a safe test push payload to your registered devices to verify delivery.
                                </p>
                            </div>
                            <button
                                onClick={handleTestNotification}
                                disabled={testLoading || !isSubscribed}
                                className="px-3.5 py-2 text-xs font-semibold bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 flex-shrink-0"
                            >
                                {testLoading ? (
                                    <>
                                        <span className="h-3 w-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        <span>Sending...</span>
                                    </>
                                ) : (
                                    <>
                                        <PaperAirplaneIcon className="h-3.5 w-3.5" />
                                        <span>Send Test Notification</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/60 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationSettingsModal;
