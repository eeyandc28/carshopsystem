import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
    ArrowLeftIcon, 
    UserIcon, 
    PhoneIcon, 
    MapPinIcon, 
    EnvelopeIcon,
    TruckIcon,
    PlusIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';

const CustomerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCustomerDetails();
    }, [id]);

    const fetchCustomerDetails = async () => {
        try {
            const response = await api.get(`/customers/${id}`);
            setCustomer(response.data.data);
        } catch (error) {
            console.error('Failed to fetch customer details', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-white text-center">Loading customer profile...</div>;
    if (!customer) return <div className="p-8 text-white text-center">Customer not found.</div>;

    return (
        <div className="space-y-6">
            <button 
                onClick={() => navigate('/customers')}
                className="flex items-center text-slate-400 hover:text-white transition-colors"
            >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Customers
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl">
                        <div className="flex flex-col items-center text-center">
                            <div className="h-20 w-20 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-3xl font-bold mb-4">
                                {customer.full_name[0]}
                            </div>
                            <h2 className="text-xl font-bold text-white">{customer.full_name}</h2>
                            <p className="text-slate-500 text-sm">Customer ID: #{customer.id.toString().padStart(4, '0')}</p>
                            
                            <div className="w-full mt-8 pt-8 border-t border-slate-800 space-y-4 text-left">
                                <div className="flex items-start space-x-3">
                                    <PhoneIcon className="h-5 w-5 text-slate-500 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</p>
                                        <p className="text-slate-300">{customer.contact_number}</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <EnvelopeIcon className="h-5 w-5 text-slate-500 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</p>
                                        <p className="text-slate-300">{customer.email || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <MapPinIcon className="h-5 w-5 text-slate-500 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address</p>
                                        <p className="text-slate-300 leading-relaxed">{customer.address}</p>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => navigate(`/customers/edit/${customer.id}`)}
                                className="w-full mt-8 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all font-semibold border border-slate-700"
                            >
                                Edit Profile
                            </button>
                        </div>
                    </div>
                </div>

                {/* Vehicles List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center">
                                <TruckIcon className="h-5 w-5 mr-2 text-blue-400" />
                                Registered Vehicles
                            </h3>
                            <button 
                                onClick={() => navigate('/vehicles/add', { state: { customerId: customer.id } })}
                                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center bg-blue-400/5 px-3 py-1.5 rounded-lg border border-blue-400/10 transition-all"
                            >
                                <PlusIcon className="h-4 w-4 mr-1" />
                                Add Vehicle
                            </button>
                        </div>
                        
                        <div className="divide-y divide-slate-800">
                            {customer.vehicles && customer.vehicles.length > 0 ? (
                                customer.vehicles.map(vehicle => (
                                    <div key={vehicle.id} className="p-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                                        <div className="flex items-center space-x-4">
                                            <div className="h-12 w-12 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                                                <TruckIcon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-white font-bold">{vehicle.plate_number}</p>
                                                <p className="text-slate-400 text-sm">{vehicle.brand} {vehicle.model} ({vehicle.year})</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                                            className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                                        >
                                            <ChevronRightIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center">
                                    <p className="text-slate-500 mb-4">No vehicles registered for this customer.</p>
                                    <button 
                                        onClick={() => navigate('/vehicles/add', { state: { customerId: customer.id } })}
                                        className="text-blue-400 font-semibold hover:underline"
                                    >
                                        Register a vehicle now
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats or Activity could go here */}
                    <div className="bg-blue-600/5 border border-blue-500/10 rounded-2xl p-6">
                        <p className="text-blue-400 text-sm font-medium">
                            This customer has been with us since {new Date(customer.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerDetails;
