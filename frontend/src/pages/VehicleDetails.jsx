import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
    ArrowLeftIcon, 
    TruckIcon, 
    UserIcon, 
    WrenchScrewdriverIcon,
    ClipboardDocumentCheckIcon,
    CalendarIcon
} from '@heroicons/react/24/outline';

const VehicleDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [vehicle, setVehicle] = useState(null);
    const [jobOrders, setJobOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVehicleDetails();
    }, [id]);

    const fetchVehicleDetails = async () => {
        try {
            const [vRes, joRes] = await Promise.all([
                api.get(`/vehicles/${id}`),
                api.get(`/job-orders?vehicle_id=${id}`)
            ]);
            setVehicle(vRes.data.data);
            // Filter locally if backend doesn't support query param yet
            const filteredOrders = joRes.data.data.filter(jo => jo.vehicle.id == id);
            setJobOrders(filteredOrders);
        } catch (error) {
            console.error('Failed to fetch vehicle details', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-white">Loading details...</div>;
    if (!vehicle) return <div className="p-8 text-white">Vehicle not found.</div>;

    return (
        <div className="space-y-6">
            <button 
                onClick={() => navigate(-1)}
                className="flex items-center text-slate-400 hover:text-white transition-colors"
            >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Vehicles
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Vehicle Specs Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="h-12 w-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400">
                                <TruckIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{vehicle.plate_number}</h2>
                                <p className="text-slate-400 text-sm">{vehicle.brand} {vehicle.model} ({vehicle.year})</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between py-2 border-b border-slate-800/50">
                                <span className="text-slate-400 text-sm">VIN</span>
                                <span className="text-white text-sm font-medium">{vehicle.vin}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-800/50">
                                <span className="text-slate-400 text-sm">Mileage</span>
                                <span className="text-white text-sm font-medium">{vehicle.mileage?.toLocaleString()} KM</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-800/50">
                                <span className="text-slate-400 text-sm">Transmission</span>
                                <span className="text-white text-sm font-medium">{vehicle.transmission}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-800/50">
                                <span className="text-slate-400 text-sm">Fuel Type</span>
                                <span className="text-white text-sm font-medium">{vehicle.fuel_type}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-slate-400 text-sm">Color</span>
                                <span className="text-white text-sm font-medium">{vehicle.color}</span>
                            </div>
                        </div>
                    </div>

                    {/* Owner Card */}
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">
                        <h3 className="text-white font-bold mb-4 flex items-center">
                            <UserIcon className="h-5 w-5 mr-2 text-blue-400" />
                            Owner Details
                        </h3>
                        <div>
                            <p className="text-white font-semibold">{vehicle.customer?.full_name}</p>
                            <p className="text-slate-400 text-sm">{vehicle.customer?.contact_number}</p>
                            <p className="text-slate-500 text-xs mt-2">{vehicle.customer?.address}</p>
                        </div>
                    </div>
                </div>

                {/* Service History */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                        <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                            <h3 className="text-white font-bold flex items-center">
                                <WrenchScrewdriverIcon className="h-5 w-5 mr-2 text-blue-400" />
                                Service & Repair History
                            </h3>
                            <button 
                                onClick={() => navigate('/job-orders/add', { state: { vehicle_id: vehicle.id, customer_id: vehicle.customer?.id } })}
                                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-all"
                            >
                                Create Job Order
                            </button>
                        </div>

                        <div className="divide-y divide-slate-800">
                            {jobOrders.length > 0 ? (
                                jobOrders.map(order => (
                                    <div key={order.id} className="p-6 hover:bg-slate-800/30 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-blue-400 font-bold text-sm">{order.order_number}</p>
                                                <p className="text-white font-medium mt-1">{order.description}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border border-slate-700 text-slate-400`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-4 text-xs text-slate-500 mt-4">
                                            <span className="flex items-center">
                                                <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center">
                                                <ClipboardDocumentCheckIcon className="h-3.5 w-3.5 mr-1" />
                                                {order.advisor?.name || 'Assigned Advisor'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center text-slate-500">
                                    No repair history found for this vehicle.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VehicleDetails;
