import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import KpiCard from '../components/ui/KpiCard';
import { 
    TruckIcon, 
    WrenchIcon, 
    CheckCircleIcon, 
    CurrencyDollarIcon,
    DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ vehicles: 0, activeOrders: 0, completed: 0, inventory: 0 });
    const [recentOrders, setRecentOrders] = useState([]);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [vehiclesRes, ordersRes, inventoryRes] = await Promise.all([
                api.get('/vehicles'),
                api.get('/job-orders'),
                api.get('/inventory')
            ]);

            const vehicles = vehiclesRes.data.data || [];
            const orders = ordersRes.data.data || [];
            const inventory = inventoryRes.data.data || [];

            const activeOrders = orders.filter(o => !['completed', 'released'].includes(o.status));
            const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'released');

            setStats({
                vehicles: vehicles.length,
                activeOrders: activeOrders.length,
                completed: completedOrders.length,
                inventory: inventory.length
            });

            setRecentOrders(orders.slice(0, 4));
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        }
    };

    const generateReport = async () => {
        setGenerating(true);
        try {
            const [vehiclesRes, ordersRes, inventoryRes, customersRes] = await Promise.all([
                api.get('/vehicles'),
                api.get('/job-orders'),
                api.get('/inventory'),
                api.get('/customers')
            ]);

            const vehicles = vehiclesRes.data.data || [];
            const orders = ordersRes.data.data || [];
            const inventory = inventoryRes.data.data || [];
            const customers = customersRes.data.data || [];

            const now = new Date();
            const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            const activeOrders = orders.filter(o => !['completed', 'released'].includes(o.status));
            const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'released');
            const lowStockItems = inventory.filter(i => i.stock_quantity <= (i.reorder_level || 5));

            let report = '';
            report += '═══════════════════════════════════════════════════\n';
            report += '        CAR SHOP MANAGEMENT SYSTEM - REPORT       \n';
            report += '═══════════════════════════════════════════════════\n';
            report += `Generated: ${dateStr} at ${timeStr}\n`;
            report += '───────────────────────────────────────────────────\n\n';

            report += '📊 SUMMARY\n';
            report += '───────────────────────────────────────────────────\n';
            report += `  Total Customers:      ${customers.length}\n`;
            report += `  Total Vehicles:       ${vehicles.length}\n`;
            report += `  Active Job Orders:    ${activeOrders.length}\n`;
            report += `  Completed Orders:     ${completedOrders.length}\n`;
            report += `  Inventory Items:      ${inventory.length}\n`;
            report += `  Low Stock Alerts:     ${lowStockItems.length}\n\n`;

            report += '🚗 VEHICLES\n';
            report += '───────────────────────────────────────────────────\n';
            vehicles.forEach(v => {
                report += `  ${v.plate_number.padEnd(12)} ${v.brand} ${v.model} (${v.year}) - Owner: ${v.customer?.full_name || 'N/A'}\n`;
            });
            report += '\n';

            report += '🔧 JOB ORDERS\n';
            report += '───────────────────────────────────────────────────\n';
            if (orders.length === 0) {
                report += '  No job orders found.\n';
            } else {
                orders.forEach(o => {
                    report += `  ${(o.order_number || 'N/A').padEnd(14)} Status: ${(o.status || 'pending').padEnd(16)} Vehicle: ${o.vehicle?.plate_number || 'N/A'}\n`;
                    report += `  ${''.padEnd(14)} ${o.description || 'No description'}\n\n`;
                });
            }

            report += '📦 INVENTORY\n';
            report += '───────────────────────────────────────────────────\n';
            report += `  ${'ITEM'.padEnd(25)} ${'PART #'.padEnd(12)} ${'STOCK'.padEnd(8)} ${'PRICE'.padEnd(10)} STATUS\n`;
            report += `  ${'─'.repeat(25)} ${'─'.repeat(12)} ${'─'.repeat(8)} ${'─'.repeat(10)} ${'─'.repeat(10)}\n`;
            inventory.forEach(i => {
                const status = i.stock_quantity <= (i.reorder_level || 5) ? '⚠ LOW' : '✓ OK';
                report += `  ${(i.name || '').padEnd(25).slice(0,25)} ${(i.part_number || '').padEnd(12)} ${String(i.stock_quantity).padEnd(8)} $${String(i.unit_price).padEnd(9)} ${status}\n`;
            });
            report += '\n';

            if (lowStockItems.length > 0) {
                report += '⚠️  LOW STOCK ALERTS\n';
                report += '───────────────────────────────────────────────────\n';
                lowStockItems.forEach(i => {
                    report += `  ⚠ ${i.name} (${i.part_number}) - Only ${i.stock_quantity} left (reorder at ${i.reorder_level || 5})\n`;
                });
                report += '\n';
            }

            report += '═══════════════════════════════════════════════════\n';
            report += '              END OF REPORT                       \n';
            report += '═══════════════════════════════════════════════════\n';

            // Download as text file
            const blob = new Blob([report], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `CarShop_Report_${now.toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Failed to generate report', error);
            alert('Failed to generate report. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
                    <p className="text-slate-400">Welcome back! Here is what is happening today.</p>
                </div>
                <div className="flex space-x-3">
                    <button 
                        onClick={generateReport}
                        disabled={generating}
                        className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-xl border border-slate-700 hover:bg-slate-700 transition-all disabled:opacity-50"
                    >
                        <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                        {generating ? 'Generating...' : 'Generate Report'}
                    </button>
                    <button 
                        onClick={() => navigate('/vehicles/add')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                    >
                        New Vehicle
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard 
                    title="Total Vehicles" 
                    value={stats.vehicles.toLocaleString()} 
                    icon={TruckIcon} 
                    trend={{ value: 12, isPositive: true }}
                    colorClass="bg-blue-600/20 shadow-blue-500/10"
                />
                <KpiCard 
                    title="Active Repairs" 
                    value={stats.activeOrders.toLocaleString()} 
                    icon={WrenchIcon} 
                    trend={{ value: 5, isPositive: false }}
                    colorClass="bg-amber-600/20 shadow-amber-500/10"
                />
                <KpiCard 
                    title="Completed" 
                    value={stats.completed.toLocaleString()} 
                    icon={CheckCircleIcon} 
                    trend={{ value: 8, isPositive: true }}
                    colorClass="bg-emerald-600/20 shadow-emerald-500/10"
                />
                <KpiCard 
                    title="Inventory Items" 
                    value={stats.inventory.toLocaleString()} 
                    icon={CurrencyDollarIcon} 
                    trend={{ value: 15, isPositive: true }}
                    colorClass="bg-purple-600/20 shadow-purple-500/10"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white">Recent Job Orders</h3>
                        <button 
                            onClick={() => navigate('/job-orders')}
                            className="text-blue-400 text-sm hover:text-blue-300 transition-colors"
                        >
                            View All →
                        </button>
                    </div>
                    <div className="space-y-4">
                        {recentOrders.length > 0 ? (
                            recentOrders.map((order, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-slate-800 hover:bg-slate-800/60 transition-colors">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-10 w-10 bg-blue-600/10 rounded-lg flex items-center justify-center text-blue-400">
                                            <WrenchIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">{order.order_number}</p>
                                            <p className="text-xs text-slate-500">{order.vehicle?.plate_number} · {order.description?.slice(0, 40)}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                        order.status === 'completed' || order.status === 'released' 
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                            : order.status === 'pending' 
                                            ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    }`}>
                                        {order.status?.replace('_', ' ')}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="h-48 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-xl">
                                <div className="text-center">
                                    <p className="text-slate-500">No job orders yet</p>
                                    <button onClick={() => navigate('/job-orders/add')} className="text-blue-400 text-sm mt-2 hover:text-blue-300">Create one →</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Quick Actions</h3>
                    <div className="space-y-3">
                        {[
                            { label: 'Add Customer', path: '/customers/add', color: 'bg-blue-600 hover:bg-blue-700' },
                            { label: 'Register Vehicle', path: '/vehicles/add', color: 'bg-emerald-600 hover:bg-emerald-700' },
                            { label: 'New Job Order', path: '/job-orders/add', color: 'bg-amber-600 hover:bg-amber-700' },
                            { label: 'Add Inventory', path: '/inventory/add', color: 'bg-purple-600 hover:bg-purple-700' },
                        ].map((action, i) => (
                            <button 
                                key={i}
                                onClick={() => navigate(action.path)}
                                className={`w-full text-left px-4 py-3 ${action.color} text-white rounded-xl transition-all text-sm font-semibold shadow-lg`}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
