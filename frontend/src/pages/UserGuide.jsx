import { useState, useMemo } from 'react';
import {
    BookOpenIcon,
    MagnifyingGlassIcon,
    ShieldCheckIcon,
    UserGroupIcon,
    ClipboardDocumentListIcon,
    XCircleIcon,
    WrenchScrewdriverIcon,
    LockClosedIcon,
    DocumentTextIcon,
    BanknotesIcon,
    ArchiveBoxIcon,
    DevicePhoneMobileIcon,
    ChevronDownIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const sections = [
    {
        id: 'overview-roles',
        title: 'Roles & Access Matrix',
        icon: ShieldCheckIcon,
        badge: 'Permissions',
        description: 'Understand user roles, access levels, and what each role can perform.'
    },
    {
        id: 'customers-vehicles',
        title: 'Customers & Vehicles',
        icon: UserGroupIcon,
        badge: 'Core Records',
        description: 'Adding customers, registering vehicles, plate number uniqueness rules.'
    },
    {
        id: 'job-orders',
        title: 'Job Order Workflow',
        icon: ClipboardDocumentListIcon,
        badge: 'Operations',
        description: 'Step-by-step job order pipeline from Pending to Released.'
    },
    {
        id: 'cancellation',
        title: 'Cancellation Conditions',
        icon: XCircleIcon,
        badge: 'Strict Rules',
        description: 'Why orders can only be cancelled while Pending and how to cancel.'
    },
    {
        id: 'parts-services',
        title: 'Parts, Services & Inclusions',
        icon: WrenchScrewdriverIcon,
        badge: 'PMS & Bundles',
        description: 'Service packages (PMS), automated stock deduction and restoration.'
    },
    {
        id: 'payment-lock',
        title: 'Paid Job Order Locking',
        icon: LockClosedIcon,
        badge: 'Security Lock',
        description: 'Why items cannot be removed or added once a job order is paid.'
    },
    {
        id: 'invoicing',
        title: 'Invoices & Documents',
        icon: DocumentTextIcon,
        badge: 'Printing & PDF',
        description: 'Final Invoice, Temporary Quotation, and Mechanic Service Invoice.'
    },
    {
        id: 'cashier',
        title: 'Cashier & Payments',
        icon: BanknotesIcon,
        badge: 'Settlement',
        description: 'Processing payments, partial vs full settlement, Cash/GCash methods.'
    },
    {
        id: 'inventory',
        title: 'Inventory & Stock Cards',
        icon: ArchiveBoxIcon,
        badge: 'Ledger & Stock',
        description: 'Tracking item movements, markup calculation, supplier deliveries.'
    },
    {
        id: 'validation-matrix',
        title: 'Validation & Conditions Table',
        icon: ExclamationTriangleIcon,
        badge: 'Reference',
        description: 'Comprehensive quick-reference table of all system validation rules.'
    },
    {
        id: 'mobile-install',
        title: 'Android App Installation',
        icon: DevicePhoneMobileIcon,
        badge: 'PWA Guide',
        description: 'How to install and run RADI8 as a fullscreen app on Android phones.'
    }
];

const UserGuide = () => {
    const [activeSection, setActiveSection] = useState('overview-roles');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSections = useMemo(() => {
        if (!searchQuery.trim()) return sections;
        const q = searchQuery.toLowerCase();
        return sections.filter(s => 
            s.title.toLowerCase().includes(q) || 
            s.description.toLowerCase().includes(q) ||
            s.badge.toLowerCase().includes(q)
        );
    }, [searchQuery]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
                            <BookOpenIcon className="h-4 w-4" />
                            Official Documentation & Process Manual
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                            RADI8 System User Guide
                        </h1>
                        <p className="text-slate-400 text-sm max-w-2xl">
                            Complete reference for all system workflows, role permissions, process validations, payment locks, and mobile setup. Accessible to all team members.
                        </p>
                    </div>

                    {/* Search bar */}
                    <div className="w-full md:w-80">
                        <div className="relative">
                            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search guides, rules, conditions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Layout: Sidebar Navigation + Content Viewer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Navigation Column */}
                <div className="lg:col-span-4 space-y-2">
                    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 shadow-lg backdrop-blur-sm sticky top-6">
                        <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/60 mb-2">
                            User Guide Chapters
                        </div>
                        <div className="space-y-1 max-h-[calc(100vh-240px)] overflow-y-auto pr-1">
                            {filteredSections.map((sec) => {
                                const Icon = sec.icon;
                                const isActive = activeSection === sec.id;
                                return (
                                    <button
                                        key={sec.id}
                                        type="button"
                                        onClick={() => {
                                            setActiveSection(sec.id);
                                            window.scrollTo({ top: 160, behavior: 'smooth' });
                                        }}
                                        className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 group cursor-pointer ${
                                            isActive
                                                ? 'bg-blue-600/15 border border-blue-500/30 text-white shadow-sm'
                                                : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
                                        }`}
                                    >
                                        <div className={`p-2 rounded-lg mt-0.5 flex-shrink-0 transition-colors ${
                                            isActive ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-white'
                                        }`}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-1">
                                                <span className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                                                    {sec.title}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                                {sec.description}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Content Details Column */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* SECTION: Overview & Roles */}
                    {activeSection === 'overview-roles' && (
                        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                            <div className="border-b border-slate-800 pb-4">
                                <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
                                    Chapter 1
                                </span>
                                <h2 className="text-xl sm:text-2xl font-bold text-white mt-2 flex items-center gap-2">
                                    <ShieldCheckIcon className="h-7 w-7 text-blue-400" />
                                    Roles & Permission Access Matrix
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">
                                    The system enforces Role-Based Access Control (RBAC) to ensure security and clean operational separation of duties.
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                                            <th className="p-3">Module / Action</th>
                                            <th className="p-3 text-center">Super Admin</th>
                                            <th className="p-3 text-center">Admin</th>
                                            <th className="p-3 text-center">General Manager</th>
                                            <th className="p-3 text-center">Service Advisor</th>
                                            <th className="p-3 text-center">Cashier</th>
                                            <th className="p-3 text-center">Mechanic</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                                        <tr>
                                            <td className="p-3 font-medium text-white">Create Job Orders</td>
                                            <td className="p-3 text-center text-emerald-400 font-bold">✓</td>
                                            <td className="p-3 text-center text-emerald-400 font-bold">✓</td>
                                            <td className="p-3 text-center text-emerald-400 font-bold">✓</td>
                                            <td className="p-3 text-center text-emerald-400 font-bold">✓</td>
                                            <td className="p-3 text-center text-slate-600">—</td>
                                            <td className="p-3 text-center text-slate-600">—</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-medium text-white">Cancel Job Orders (Pending Only)</td>
                                            <td className="p-3 text-center text-emerald-400 font-bold">✓</td>
                                            <td className="p-3 text-center text-emerald-400 font-bold">✓</td>
                                            <td className="p-3 text-center text-emerald-400 font-bold">✓</td>
                                            <td className="p-3 text-center text-emerald-400 font-bold">✓</td>
                                            <td className="p-3 text-center text-slate-600">—</td>
                                            <td className="p-3 text-center text-slate-600">—</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-medium text-white">Add / Delete Order Items</td>
                                            <td className="p-3 text-center text-emerald-400 font-bold">Unpaid Only</td>
                                            <td className="p-3 text-center text-emerald-400 font-bold">Unpaid Only</td>
                                            <td className="p-3 text-center text-emerald-400 font-bold">Unpaid Only</td>
                                            <td className="p-3 text-center text-emerald-400 font-bold">Unpaid Only</td>
                                            <td className="p-3 text-center text-slate-600">—</td>
                                            <td className="p-3 text-center text-slate-600">—</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-medium text-white">Job Status Pipeline Updates</td>
                                            <td className="p-3 text-center text-emerald-400 font-bold">Full</td>
                                            <td className="p-3 text-center text-emerald-400 font-bold">Full</td>
                                            <td className="p-3 text-center text-emerald-400 font-bold">Full</td>
                                            <td className="p-3 text-center text-emerald-400 font-bold">Full</td>
                                            <td className="p-3 text-center text-slate-600">View Only</td>
                                            <td className="p-3 text-center text-blue-400 font-semibold">Diagnosing → Completed</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-medium text-white">Process Cashier Payments</td>
                                            <td className="p-3 text-center text-emerald-400 font-bold">✓</td>
                                            <td className="p-3 text-center text-emerald-400 font-bold">✓</td>
                                            <td className="p-3 text-center text-emerald-400 font-bold">✓</td>
                                            <td className="p-3 text-center text-slate-600">—</td>
                                            <td className="p-3 text-center text-emerald-400 font-bold">✓</td>
                                            <td className="p-3 text-center text-slate-600">—</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-medium text-white">Stock Deliveries / Purchasing</td>
                                            <td className="p-3 text-center text-emerald-400 font-bold">✓</td>
                                            <td className="p-3 text-center text-emerald-400 font-bold">✓</td>
                                            <td className="p-3 text-center text-emerald-400 font-bold">✓</td>
                                            <td className="p-3 text-center text-slate-600">—</td>
                                            <td className="p-3 text-center text-slate-600">—</td>
                                            <td className="p-3 text-center text-slate-600">—</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-medium text-white">User Accounts & Roles</td>
                                            <td className="p-3 text-center text-emerald-400 font-bold">✓</td>
                                            <td className="p-3 text-center text-emerald-400 font-bold">✓</td>
                                            <td className="p-3 text-center text-slate-600">View Only</td>
                                            <td className="p-3 text-center text-slate-600">—</td>
                                            <td className="p-3 text-center text-slate-600">—</td>
                                            <td className="p-3 text-center text-slate-600">—</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SECTION: Customers & Vehicles */}
                    {activeSection === 'customers-vehicles' && (
                        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                            <div className="border-b border-slate-800 pb-4">
                                <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
                                    Chapter 2
                                </span>
                                <h2 className="text-xl sm:text-2xl font-bold text-white mt-2 flex items-center gap-2">
                                    <UserGroupIcon className="h-7 w-7 text-blue-400" />
                                    Customer & Vehicle Registration Rules
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">
                                    Managing vehicle owners, fleets, and technical vehicle profiles.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                                    <h3 className="font-bold text-white text-sm">Customer Record Rules</h3>
                                    <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                                        <li><strong className="text-slate-200">First Name & Last Name:</strong> Required, max 100 characters.</li>
                                        <li><strong className="text-slate-200">Mobile Phone:</strong> Must be a valid mobile format (e.g., <code className="text-blue-400">09XXXXXXXXX</code>).</li>
                                        <li><strong className="text-slate-200">Linked Vehicles:</strong> A customer can own multiple vehicles; deletion of a customer requires resolving active vehicle job orders.</li>
                                    </ul>
                                </div>

                                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                                    <h3 className="font-bold text-white text-sm">Vehicle Registration Rules</h3>
                                    <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                                        <li><strong className="text-slate-200">Plate Number:</strong> Must be strictly <span className="text-amber-400 font-semibold">UNIQUE</span> across the entire database.</li>
                                        <li><strong className="text-slate-200">Auto-Formatting:</strong> Plate letters are automatically converted to uppercase and trimmed.</li>
                                        <li><strong className="text-slate-200">Odometer:</strong> Odometer readings update upon each Job Order to maintain mileage history.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION: Job Orders Workflow */}
                    {activeSection === 'job-orders' && (
                        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                            <div className="border-b border-slate-800 pb-4">
                                <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
                                    Chapter 3
                                </span>
                                <h2 className="text-xl sm:text-2xl font-bold text-white mt-2 flex items-center gap-2">
                                    <ClipboardDocumentListIcon className="h-7 w-7 text-blue-400" />
                                    Job Order Lifecycle & Status Pipeline
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">
                                    From intake to inspection, repair, completion, and vehicle release.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                                    <h3 className="font-bold text-white text-sm">Standard Status Transitions</h3>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <span className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">1. PENDING</span>
                                        <span className="text-slate-500 self-center">➔</span>
                                        <span className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">2. DIAGNOSING</span>
                                        <span className="text-slate-500 self-center">➔</span>
                                        <span className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">3. WAITING FOR PARTS</span>
                                        <span className="text-slate-500 self-center">➔</span>
                                        <span className="px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">4. IN PROGRESS</span>
                                        <span className="text-slate-500 self-center">➔</span>
                                        <span className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">5. COMPLETED</span>
                                        <span className="text-slate-500 self-center">➔</span>
                                        <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">6. RELEASED</span>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Status can be updated using the step timeline tracker or the quick-action status buttons. Every transition logs the timestamp, acting user ID, and notes in the system audit log.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION: Cancellation Conditions */}
                    {activeSection === 'cancellation' && (
                        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                            <div className="border-b border-slate-800 pb-4">
                                <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold">
                                    Chapter 4
                                </span>
                                <h2 className="text-xl sm:text-2xl font-bold text-white mt-2 flex items-center gap-2">
                                    <XCircleIcon className="h-7 w-7 text-red-400" />
                                    Job Order Cancellation Rules & Constraints
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">
                                    Conditions under which an invoice or job order can be cancelled.
                                </p>
                            </div>

                            <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-xl space-y-3">
                                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                                    <ExclamationTriangleIcon className="h-5 w-5" />
                                    <span>STRICT RULE: ONLY PENDING JOB ORDERS CAN BE CANCELLED</span>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    To protect financial reporting and physical inventory accountability, a Job Order <strong>CANNOT</strong> be cancelled once work or diagnosis has begun (<code className="text-amber-400">diagnosing</code>, <code className="text-amber-400">in_progress</code>, <code className="text-amber-400">completed</code>, or <code className="text-amber-400">released</code>).
                                </p>
                                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                                    <li>The <strong className="text-white">Cancel Invoice</strong> button is automatically hidden if status is not Pending.</li>
                                    <li>Backend API returns <code className="text-red-400">422 Unprocessable Content: Only pending job orders can be cancelled.</code> if directly invoked.</li>
                                    <li>Cancelling requires selecting a <strong>Reason Category</strong> and writing detailed notes.</li>
                                    <li>All deducted stock is returned to inventory upon cancellation.</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* SECTION: Parts, Services & Inclusions */}
                    {activeSection === 'parts-services' && (
                        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                            <div className="border-b border-slate-800 pb-4">
                                <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
                                    Chapter 5
                                </span>
                                <h2 className="text-xl sm:text-2xl font-bold text-white mt-2 flex items-center gap-2">
                                    <WrenchScrewdriverIcon className="h-7 w-7 text-blue-400" />
                                    Parts, Service Bundles & Inclusions (PMS)
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">
                                    Automatic package bundle inclusions, inventory deductions, and cascade deletion.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                                    <h3 className="font-bold text-white text-sm">Package Inclusions (e.g. Periodic Maintenance Service - PMS)</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Services configured with inclusions (like Engine Oil and Car Wash) automatically append child rows with <code className="text-emerald-400">INCLUDED</code> and <code className="text-emerald-400">₱0.00</code> price tag. The customer is charged only for the main service package.
                                    </p>
                                </div>

                                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                                    <h3 className="font-bold text-white text-sm">Automated Inventory Stock Deductions</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Adding an inventory part or a service with fluid/filter inclusions automatically decrements warehouse stock by the specified quantity.
                                    </p>
                                </div>

                                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                                    <h3 className="font-bold text-white text-sm">Cascade Deletion & Stock Restoration</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Deleting a parent service package (such as PMS) automatically removes all child inclusions (e.g., <code className="text-slate-300">Synthetic Oil 5W-30 (Included with PMS)</code>) and restores the deducted oil/filter stock back to inventory.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION: Payment Lock */}
                    {activeSection === 'payment-lock' && (
                        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                            <div className="border-b border-slate-800 pb-4">
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                                    Chapter 6
                                </span>
                                <h2 className="text-xl sm:text-2xl font-bold text-white mt-2 flex items-center gap-2">
                                    <LockClosedIcon className="h-7 w-7 text-emerald-400" />
                                    Paid Job Order Item Locking Rules
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">
                                    Preventing bill tampering and maintaining financial ledger consistency.
                                </p>
                            </div>

                            <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-3">
                                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                                    <LockClosedIcon className="h-5 w-5" />
                                    <span>ONCE PAID: ITEMS CANNOT BE ADDED OR REMOVED</span>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    When an invoice is paid and settled in the Cashier module, its billed total matches the officially issued payment receipt. Therefore, items become strictly immutable:
                                </p>
                                <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                                    <li><strong className="text-white">Trash Icon Removed:</strong> Replaced with a locked padlock icon <code className="text-slate-500">🔒</code> with tooltip: <em>"Items cannot be removed once the job order is paid"</em>.</li>
                                    <li><strong className="text-white">Add Row Hidden:</strong> The bottom input row is replaced with: <code className="text-emerald-400">🔒 Job Order is fully paid. Items cannot be added or removed.</code></li>
                                    <li><strong className="text-white">Backend Enforcement:</strong> The API rejects deletion or addition attempts with HTTP <code className="text-red-400">422 Unprocessable Content</code>.</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* SECTION: Invoicing & Documents */}
                    {activeSection === 'invoicing' && (
                        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                            <div className="border-b border-slate-800 pb-4">
                                <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
                                    Chapter 7
                                </span>
                                <h2 className="text-xl sm:text-2xl font-bold text-white mt-2 flex items-center gap-2">
                                    <DocumentTextIcon className="h-7 w-7 text-blue-400" />
                                    Invoices & Printable PDF Documents
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">
                                    Generating client bills, shop floor sheets, and quotation estimates.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                                    <div className="text-blue-400 font-bold text-sm">Generate Invoice</div>
                                    <p className="text-xs text-slate-400">
                                        The official customer tax invoice showing line items, unit costs, discounts, and real-time payment settlement stamp (Paid / Unpaid).
                                    </p>
                                </div>

                                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                                    <div className="text-amber-400 font-bold text-sm">Temporary Invoice</div>
                                    <p className="text-xs text-slate-400">
                                        Preliminary estimate / quotation provided before work starts. Labeled clearly with disclaimers that prices are subject to inspection.
                                    </p>
                                </div>

                                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                                    <div className="text-purple-400 font-bold text-sm">Service Invoice (No Amount)</div>
                                    <p className="text-xs text-slate-400">
                                        Shop floor work sheet for mechanics. Contains customer complaints, diagnosis, and required parts list while completely hiding all prices.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION: Cashier & Payments */}
                    {activeSection === 'cashier' && (
                        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                            <div className="border-b border-slate-800 pb-4">
                                <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
                                    Chapter 8
                                </span>
                                <h2 className="text-xl sm:text-2xl font-bold text-white mt-2 flex items-center gap-2">
                                    <BanknotesIcon className="h-7 w-7 text-blue-400" />
                                    Cashier & Payment Processing
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">
                                    Settling orders, issuing official receipts, and handling partial deposits.
                                </p>
                            </div>

                            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                                    <h3 className="font-bold text-white text-sm">Supported Payment Methods</h3>
                                    <p className="text-slate-400">
                                        Cash, GCash, Bank Transfer, and Credit/Debit Card. Reference numbers are required for electronic transactions.
                                    </p>
                                </div>

                                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                                    <h3 className="font-bold text-white text-sm">Partial Settlement vs Full Settlement</h3>
                                    <ul className="text-slate-400 space-y-1 list-disc list-inside">
                                        <li><strong>Full Payment:</strong> When tendered amount equals total, status becomes <span className="text-emerald-400 font-semibold">PAID</span> and balance due is <span className="text-emerald-400 font-semibold">₱0.00 (Settled)</span>.</li>
                                        <li><strong>Partial Payment:</strong> If customer pays an initial deposit, status becomes <span className="text-amber-400 font-semibold">PARTIAL</span>, and the remaining amount is tracked as <span className="text-amber-400 font-semibold">Balance Due</span>.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION: Inventory */}
                    {activeSection === 'inventory' && (
                        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                            <div className="border-b border-slate-800 pb-4">
                                <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
                                    Chapter 9
                                </span>
                                <h2 className="text-xl sm:text-2xl font-bold text-white mt-2 flex items-center gap-2">
                                    <ArchiveBoxIcon className="h-7 w-7 text-blue-400" />
                                    Inventory, Stock Cards & Deliveries
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">
                                    Warehouse stocks, reorder thresholds, markup calculations, and supplier deliveries.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                                    <h3 className="font-bold text-white text-sm">Selling Price Formula</h3>
                                    <div className="p-3 bg-slate-900 rounded-lg font-mono text-xs text-blue-300">
                                        Selling Price = Unit Cost × (1 + (Markup Rate % / 100))
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                                    <h3 className="font-bold text-white text-sm">Stock Card Ledger Tracking</h3>
                                    <p className="text-xs text-slate-400">
                                        Every item has an immutable ledger recording:
                                    </p>
                                    <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                                        <li><strong className="text-emerald-400">Stock IN:</strong> Supplier deliveries, purchase order receipts, order cancellation restorations.</li>
                                        <li><strong className="text-red-400">Stock OUT:</strong> Job Order line items, PMS fluid consumption, manual scrap adjustments.</li>
                                        <li><strong className="text-blue-400">Balance:</strong> Real-time available physical warehouse stock.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION: Validation Matrix */}
                    {activeSection === 'validation-matrix' && (
                        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                            <div className="border-b border-slate-800 pb-4">
                                <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
                                    Chapter 10
                                </span>
                                <h2 className="text-xl sm:text-2xl font-bold text-white mt-2 flex items-center gap-2">
                                    <ExclamationTriangleIcon className="h-7 w-7 text-amber-400" />
                                    System Conditions & Validation Rules Matrix
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">
                                    Quick reference of all business rules, triggers, and error responses.
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                                            <th className="p-3">User Action</th>
                                            <th className="p-3">Required Condition</th>
                                            <th className="p-3">Behavior if Condition Fails</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                                        <tr>
                                            <td className="p-3 font-semibold text-white">Delete Item from Order</td>
                                            <td className="p-3">Job Order <code className="text-emerald-400 font-semibold">payment_status !== 'paid'</code></td>
                                            <td className="p-3 text-red-400">Blocked. Trash icon replaced with lock; API returns HTTP 422.</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-semibold text-white">Add Item to Order</td>
                                            <td className="p-3">Job Order <code className="text-emerald-400 font-semibold">payment_status !== 'paid'</code></td>
                                            <td className="p-3 text-red-400">Blocked. Add form hidden; API returns HTTP 422.</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-semibold text-white">Cancel Job Order</td>
                                            <td className="p-3">Status is strictly <code className="text-blue-400 font-semibold">pending</code></td>
                                            <td className="p-3 text-red-400">Blocked. Cancel button hidden; API returns HTTP 422.</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-semibold text-white">Cancel Job Order</td>
                                            <td className="p-3">Reason Category and Notes provided</td>
                                            <td className="p-3 text-red-400">Modal form validation prevents submission.</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-semibold text-white">Vehicle Plate Registration</td>
                                            <td className="p-3">Plate must be unique in system</td>
                                            <td className="p-3 text-red-400">API returns HTTP 422: Plate already exists.</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-semibold text-white">Release Vehicle</td>
                                            <td className="p-3">Status must be completed</td>
                                            <td className="p-3 text-red-400">Workflow requires work completion before release.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SECTION: Android / Mobile Install */}
                    {activeSection === 'mobile-install' && (
                        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                            <div className="border-b border-slate-800 pb-4">
                                <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
                                    Chapter 11
                                </span>
                                <h2 className="text-xl sm:text-2xl font-bold text-white mt-2 flex items-center gap-2">
                                    <DevicePhoneMobileIcon className="h-7 w-7 text-blue-400" />
                                    How to Install on Android Smartphones (PWA)
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">
                                    Run RADI8 as a standalone fullscreen app without the browser address bar.
                                </p>
                            </div>

                            <div className="space-y-4 text-xs text-slate-300">
                                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-xs">1</span>
                                        Connect Phone to Same Wi-Fi Network
                                    </h3>
                                    <p className="text-slate-400">
                                        Connect your phone to the same Wi-Fi network as the host computer. Find your PC's IP address (e.g. <code className="text-blue-400">192.168.1.15</code>) and open Google Chrome on your phone to <code className="text-blue-400">http://192.168.1.15:5174</code>.
                                    </p>
                                </div>

                                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-xs">2</span>
                                        Add to Home Screen in Chrome
                                    </h3>
                                    <p className="text-slate-400">
                                        In Google Chrome on your phone, tap the <strong>3 vertical dots menu (⋮)</strong> at the top-right corner, then tap <strong>"Add to Home screen"</strong> (or <strong>"Install app"</strong>).
                                    </p>
                                </div>

                                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-xs">3</span>
                                        Enjoy Native App Experience
                                    </h3>
                                    <p className="text-slate-400">
                                        A <strong>RADI8</strong> icon is placed directly on your phone's Home Screen and App Drawer. Tapping it opens RADI8 in fullscreen mode with fast bottom navigation.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default UserGuide;
