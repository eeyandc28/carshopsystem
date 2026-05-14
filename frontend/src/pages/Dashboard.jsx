import { useNavigate } from 'react-router-dom';
import KpiCard from '../components/ui/KpiCard';
import { 
    TruckIcon, 
    WrenchIcon, 
    CheckCircleIcon, 
    CurrencyDollarIcon 
} from '@heroicons/react/24/outline';

const Dashboard = () => {
    const navigate = useNavigate();
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
                    <p className="text-slate-400">Welcome back! Here is what is happening today.</p>
                </div>
                <div className="flex space-x-3">
                    <button className="px-4 py-2 bg-slate-800 text-white rounded-xl border border-slate-700 hover:bg-slate-700 transition-all">
                        Generate Report
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
                    title="Vehicles Serviced" 
                    value="1,284" 
                    icon={TruckIcon} 
                    trend={{ value: 12, isPositive: true }}
                    colorClass="bg-blue-600/20 shadow-blue-500/10"
                />
                <KpiCard 
                    title="Active Repairs" 
                    value="24" 
                    icon={WrenchIcon} 
                    trend={{ value: 5, isPositive: false }}
                    colorClass="bg-amber-600/20 shadow-amber-500/10"
                />
                <KpiCard 
                    title="Completed Today" 
                    value="18" 
                    icon={CheckCircleIcon} 
                    trend={{ value: 8, isPositive: true }}
                    colorClass="bg-emerald-600/20 shadow-emerald-500/10"
                />
                <KpiCard 
                    title="Monthly Revenue" 
                    value="$42,500" 
                    icon={CurrencyDollarIcon} 
                    trend={{ value: 15, isPositive: true }}
                    colorClass="bg-purple-600/20 shadow-purple-500/10"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white">Revenue Trends</h3>
                        <select className="bg-slate-800 border-none text-slate-300 text-sm rounded-lg focus:ring-0">
                            <option>Last 7 days</option>
                            <option>Last 30 days</option>
                        </select>
                    </div>
                    <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-xl">
                        <p className="text-slate-500">Chart Placeholder (Revenue Graph)</p>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Recent Activities</h3>
                    <div className="space-y-6">
                        {[
                            { user: 'John Doe', action: 'completed repair on', target: 'ABC-1234', time: '2 mins ago' },
                            { user: 'Mike Smith', action: 'added new customer', target: 'Sarah Jane', time: '15 mins ago' },
                            { user: 'Jane Wilson', action: 'updated stock for', target: 'Oil Filter X', time: '1 hour ago' },
                            { user: 'System', action: 'low stock alert', target: 'Brake Pads', time: '2 hours ago' },
                        ].map((activity, i) => (
                            <div key={i} className="flex space-x-3">
                                <div className="h-2 w-2 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
                                <div>
                                    <p className="text-sm text-slate-300">
                                        <span className="font-bold text-white">{activity.user}</span> {activity.action} <span className="font-bold text-blue-400">{activity.target}</span>
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
