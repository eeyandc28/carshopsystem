import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
    PlusIcon, 
    MagnifyingGlassIcon, 
    ChevronRightIcon, 
    TruckIcon,
    PencilSquareIcon,
    TrashIcon
} from '@heroicons/react/24/outline';

const Vehicles = () => {
    const navigate = useNavigate();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const response = await api.get('/vehicles');
            setVehicles(response.data.data);
        } catch (error) {
            console.error('Failed to fetch vehicles', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteVehicle = async (id, plateName) => {
        if (!window.confirm(`Are you sure you want to delete vehicle "${plateName}"? This action cannot be undone.`)) return;
        try {
            await api.delete(`/vehicles/${id}`);
            setVehicles(vehicles.filter(v => v.id !== id));
        } catch (error) {
            alert('Failed to delete vehicle.');
        }
    };

    const filteredVehicles = vehicles.filter(vehicle => 
        vehicle.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Vehicles</h1>
                    <p className="text-slate-400">View and manage all registered vehicles in the system.</p>
                </div>
                <button 
                    onClick={() => navigate('/vehicles/add')}
                    className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Register Vehicle
                </button>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center">
                    <div className="relative flex-1 max-w-md">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                        <input 
                            type="text"
                            placeholder="Search by plate, brand or model..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Vehicle</th>
                                <th className="px-6 py-4 font-semibold">Customer / Owner</th>
                                <th className="px-6 py-4 font-semibold">Specs</th>
                                <th className="px-6 py-4 font-semibold">Mileage</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-48"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-12"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-20 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredVehicles.length > 0 ? (
                                filteredVehicles.map((vehicle) => (
                                    <tr key={vehicle.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                                                    <TruckIcon className="h-5 w-5" />
                                                </div>
                                                <div className="ml-4">
                                                    <p className="text-sm font-semibold text-white">{vehicle.plate_number}</p>
                                                    <p className="text-xs text-slate-500">{vehicle.brand} {vehicle.model} ({vehicle.year})</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-300 font-medium">{vehicle.customer?.full_name}</p>
                                            <p className="text-xs text-slate-500">{vehicle.customer?.contact_number}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col space-y-1">
                                                <span className="text-xs text-slate-400">{vehicle.transmission}</span>
                                                <span className="text-xs text-slate-400">{vehicle.fuel_type}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-300">{vehicle.mileage?.toLocaleString()} KM</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-1">
                                                <button 
                                                    onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                                                    title="View Details"
                                                    className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                                                >
                                                    <ChevronRightIcon className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={() => navigate(`/vehicles/${vehicle.id}/edit`)}
                                                    title="Edit"
                                                    className="p-2 text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-all"
                                                >
                                                    <PencilSquareIcon className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={() => deleteVehicle(vehicle.id, vehicle.plate_number)}
                                                    title="Delete"
                                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="h-12 w-12 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                                <TruckIcon className="h-6 w-6 text-slate-500" />
                                            </div>
                                            <p className="text-slate-400 font-medium">No vehicles found</p>
                                            <p className="text-slate-600 text-sm mt-1">Register a new vehicle to see it here.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Vehicles;
