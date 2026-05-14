import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { ClipboardDocumentListIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const schema = yup.object({
    customer_id: yup.string().required('Customer is required'),
    vehicle_id: yup.string().required('Vehicle is required'),
    service_type: yup.string().required('Service type is required'),
    description: yup.string().required('Description is required'),
    estimated_cost: yup.number().typeError('Must be a number').nullable(),
    promised_at: yup.date().nullable(),
}).required();

const AddJobOrder = () => {
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const navigate = useNavigate();
    
    const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm({
        resolver: yupResolver(schema)
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        if (selectedCustomer) {
            fetchVehicles(selectedCustomer);
        } else {
            setVehicles([]);
        }
    }, [selectedCustomer]);

    const fetchCustomers = async () => {
        try {
            const response = await api.get('/customers');
            setCustomers(response.data.data);
        } catch (error) {
            console.error('Failed to fetch customers', error);
        }
    };

    const fetchVehicles = async (customerId) => {
        try {
            const response = await api.get(`/vehicles?customer_id=${customerId}`);
            // Filter locally if API doesn't support filter
            const filtered = response.data.data.filter(v => v.customer.id == customerId);
            setVehicles(filtered);
        } catch (error) {
            console.error('Failed to fetch vehicles', error);
        }
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await api.post('/job-orders', data);
            navigate('/job-orders');
        } catch (error) {
            console.error('Failed to create job order', error);
            alert(error.response?.data?.message || 'Failed to create job order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <button 
                onClick={() => navigate(-1)}
                className="flex items-center text-slate-400 hover:text-white transition-colors"
            >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
            </button>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl">
                <div className="flex items-center space-x-4 mb-8 pb-6 border-b border-slate-800">
                    <div className="h-12 w-12 bg-blue-600/20 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                        <ClipboardDocumentListIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">New Job Order</h1>
                        <p className="text-slate-400 text-sm">Create a new service request for a vehicle.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Customer</label>
                            <select 
                                {...register('customer_id')} 
                                onChange={(e) => {
                                    register('customer_id').onChange(e);
                                    setSelectedCustomer(e.target.value);
                                    setValue('vehicle_id', '');
                                }}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                            >
                                <option value="">Select Customer</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.full_name}</option>
                                ))}
                            </select>
                            {errors.customer_id && <p className="mt-1 text-xs text-red-400">{errors.customer_id.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Vehicle</label>
                            <select 
                                {...register('vehicle_id')} 
                                disabled={!selectedCustomer}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none disabled:opacity-50"
                            >
                                <option value="">Select Vehicle</option>
                                {vehicles.map(v => (
                                    <option key={v.id} value={v.id}>{v.plate_number} - {v.brand} {v.model}</option>
                                ))}
                            </select>
                            {errors.vehicle_id && <p className="mt-1 text-xs text-red-400">{errors.vehicle_id.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Service Type</label>
                            <select 
                                {...register('service_type')} 
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                            >
                                <option value="">Select Type</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Repair">Repair</option>
                                <option value="Body Work">Body Work</option>
                                <option value="Electrical">Electrical</option>
                                <option value="Oil Change">Oil Change</option>
                            </select>
                            {errors.service_type && <p className="mt-1 text-xs text-red-400">{errors.service_type.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Promised Delivery Date (Optional)</label>
                            <input 
                                type="date" 
                                {...register('promised_at')} 
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Service Description / Concerns</label>
                        <textarea 
                            {...register('description')} 
                            rows="4" 
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                            placeholder="Describe the issues or work to be done..."
                        ></textarea>
                        {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Estimated Cost ($)</label>
                        <input 
                            type="number" 
                            step="0.01"
                            {...register('estimated_cost')} 
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                            placeholder="0.00" 
                        />
                        {errors.estimated_cost && <p className="mt-1 text-xs text-red-400">{errors.estimated_cost.message}</p>}
                    </div>

                    <div className="pt-6 border-t border-slate-800 flex justify-end space-x-4">
                        <button 
                            type="button" 
                            onClick={() => navigate(-1)}
                            className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all font-semibold"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg shadow-blue-500/25 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Job Order'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddJobOrder;
