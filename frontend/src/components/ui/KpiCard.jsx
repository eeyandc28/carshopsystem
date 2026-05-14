const KpiCard = ({ title, value, icon: Icon, trend, colorClass }) => {
    return (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-400">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-white">{value}</p>
                </div>
                <div className={`p-3 rounded-xl ${colorClass}`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center text-sm">
                    <span className={trend.isPositive ? 'text-emerald-500' : 'text-rose-500'}>
                        {trend.isPositive ? '↑' : '↓'} {trend.value}%
                    </span>
                    <span className="ml-2 text-slate-500">vs last month</span>
                </div>
            )}
        </div>
    );
};

export default KpiCard;
