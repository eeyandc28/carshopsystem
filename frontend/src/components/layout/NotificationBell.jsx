import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BellIcon,
    ClipboardDocumentListIcon,
    TruckIcon,
    BanknotesIcon,
    ArchiveBoxIcon,
    ClockIcon,
    Cog6ToothIcon,
    CheckIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import {
    fetchInAppNotifications,
    markNotificationRead,
    markAllNotificationsRead
} from '../../services/pushNotificationService';
import NotificationSettingsModal from '../pwa/NotificationSettingsModal';

function formatRelativeTime(dateString) {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);

    if (diffSecs < 60) return 'Just now';
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    if (diffSecs < 172800) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getNotificationIcon(type) {
    switch (type) {
        case 'job_order':
        case 'job_orders':
            return <ClipboardDocumentListIcon className="h-4 w-4 text-blue-400" />;
        case 'vehicle':
        case 'vehicles':
            return <TruckIcon className="h-4 w-4 text-emerald-400" />;
        case 'payment':
        case 'payments':
            return <BanknotesIcon className="h-4 w-4 text-amber-400" />;
        case 'inventory':
            return <ArchiveBoxIcon className="h-4 w-4 text-purple-400" />;
        case 'appointment':
        case 'appointments':
            return <ClockIcon className="h-4 w-4 text-cyan-400" />;
        default:
            return <BellIcon className="h-4 w-4 text-slate-400" />;
    }
}

const NotificationBell = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const loadNotifications = async () => {
        try {
            const data = await fetchInAppNotifications();
            if (data && Array.isArray(data.notifications)) {
                setNotifications(data.notifications);
                setUnreadCount(data.unread_count || 0);
            }
        } catch (e) {
            console.warn('[Bell] Failed to fetch:', e);
        }
    };

    useEffect(() => {
        loadNotifications();
        // Poll every 45 seconds to keep unread badges fresh
        const timer = setInterval(loadNotifications, 45000);
        return () => clearInterval(timer);
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleItemClick = async (notif) => {
        if (!notif.read_at) {
            await markNotificationRead(notif.id);
            setNotifications(prev =>
                prev.map(n => n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
        setIsOpen(false);

        if (notif.url) {
            navigate(notif.url);
        }
    };

    const handleMarkAllRead = async () => {
        setLoading(true);
        try {
            await markAllNotificationsRead();
            setNotifications(prev =>
                prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
            );
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Trigger Button */}
            <button
                type="button"
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) loadNotifications();
                }}
                className="relative p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-all focus:outline-none"
                aria-label="View notifications"
            >
                <BellIcon className="h-5 w-5 sm:h-6 sm:w-6" />

                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-600 rounded-full border-2 border-slate-900 shadow-sm animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in text-slate-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm">Notifications</span>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    disabled={loading}
                                    className="p-1.5 text-xs text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                                    title="Mark all as read"
                                >
                                    <CheckIcon className="h-3.5 w-3.5" />
                                    <span className="text-[11px] hidden sm:inline">Mark read</span>
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setIsSettingsOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                title="Notification Settings"
                                aria-label="Notification Settings"
                            >
                                <Cog6ToothIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/60">
                        {notifications.length === 0 ? (
                            <div className="py-10 px-4 text-center">
                                <div className="h-10 w-10 mx-auto rounded-full bg-slate-800/60 flex items-center justify-center text-slate-500 mb-2">
                                    <BellIcon className="h-5 w-5" />
                                </div>
                                <p className="text-sm font-medium text-slate-300">All caught up!</p>
                                <p className="text-xs text-slate-500 mt-0.5">No notifications at the moment.</p>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const isUnread = !notif.read_at;
                                return (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleItemClick(notif)}
                                        className={`p-3.5 sm:p-4 hover:bg-slate-800/60 cursor-pointer transition-colors flex items-start gap-3 relative ${
                                            isUnread ? 'bg-blue-950/20' : ''
                                        }`}
                                    >
                                        <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            {getNotificationIcon(notif.type)}
                                        </div>

                                        <div className="flex-1 min-w-0 pr-2">
                                            <div className="flex items-center justify-between gap-1 mb-0.5">
                                                <p className={`text-xs sm:text-sm font-medium truncate ${
                                                    isUnread ? 'text-white font-semibold' : 'text-slate-300'
                                                }`}>
                                                    {notif.title}
                                                </p>
                                                <span className="text-[10px] text-slate-500 flex-shrink-0">
                                                    {formatRelativeTime(notif.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                                {notif.message}
                                            </p>
                                        </div>

                                        {isUnread && (
                                            <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 self-center" />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setIsSettingsOpen(true);
                            }}
                            className="w-full py-1.5 px-3 text-center text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                        >
                            <Cog6ToothIcon className="h-3.5 w-3.5" />
                            <span>Manage Notification Preferences</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Notification Settings Modal */}
            <NotificationSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </div>
    );
};

export default NotificationBell;
