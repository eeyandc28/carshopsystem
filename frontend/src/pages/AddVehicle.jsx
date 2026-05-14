import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { TruckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const schema = yup.object({
    customer_id: yup.string().required('Customer is required'),
    plate_number: yup.string().required('Plate number is required'),
    vin: yup.string().required('VIN is required'),
    brand: yup.string().required('Brand is required'),
    model: yup.string().required('Model is required'),
    year: yup.number().typeError('Must be a number').required('Year is required').min(1900).max(new Date().getFullYear() + 1),
    transmission: yup.string().required('Transmission is required'),
    fuel_type: yup.string().required('Fuel type is required'),
    mileage: yup.number().typeError('Must be a number').required('Mileage is required').min(0),
    color: yup.string().required('Color is required'),
}).required();

const AddVehicle = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const response = await api.get('/customers');
            setCustomers(response.data.data);
        } catch (error) {
            console.error('Failed to fetch customers', error);
        }
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await api.post('/vehicles', data);
            navigate('/vehicles');
        } catch (error) {
            console.error('Failed to add vehicle', error);
            alert(error.response?.data?.message || 'Failed to add vehicle');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
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
                        <TruckIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Add New Vehicle</h1>
                        <p className="text-slate-400 text-sm">Register a new vehicle to a customer's account.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Customer Selection */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Select Customer</label>
                            <select
                                {...register('customer_id')}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                            >
                                <option value="">-- Choose a Customer --</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.full_name} ({c.contact_number})</option>
                                ))}
                            </select>
                            {errors.customer_id && <p className="mt-1 text-xs text-red-400">{errors.customer_id.message}</p>}
                        </div>

                        {/* Identification */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Plate Number</label>
                            <input {...register('plate_number')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="ABC-1234" />
                            {errors.plate_number && <p className="mt-1 text-xs text-red-400">{errors.plate_number.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">VIN / Chassis Number</label>
                            <input {...register('vin')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter VIN" />
                            {errors.vin && <p className="mt-1 text-xs text-red-400">{errors.vin.message}</p>}
                        </div>

                        {/* Vehicle Details */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Brand</label>
                            <input {...register('brand')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Toyota, Honda, etc." />
                            {errors.brand && <p className="mt-1 text-xs text-red-400">{errors.brand.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Model</label>
                            <input {...register('model')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Corolla, Civic, etc." />
                            {errors.model && <p className="mt-1 text-xs text-red-400">{errors.model.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Year</label>
                            <input {...register('year')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="2022" />
                            {errors.year && <p className="mt-1 text-xs text-red-400">{errors.year.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Color</label>
                            <input {...register('color')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Midnight Black" />
                            {errors.color && <p className="mt-1 text-xs text-red-400">{errors.color.message}</p>}
                        </div>

                        {/* Technical Spec */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Transmission</label>
                            <select {...register('transmission')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none">
                                <option value="">-- Select --</option>
                                <option value="Automatic">Automatic</option>
                                <option value="Manual">Manual</option>
                                <option value="CVT">CVT</option>
                            </select>
                            {errors.transmission && <p className="mt-1 text-xs text-red-400">{errors.transmission.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Fuel Type</label>
                            <select {...register('fuel_type')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none">
                                <option value="">-- Select --</option>
                                <option value="Gasoline">Gasoline</option>
                                <option value="Diesel">Diesel</option>
                                <option value="Electric">Electric</option>
                                <option value="Hybrid">Hybrid</option>
                            </select>
                            {errors.fuel_type && <p className="mt-1 text-xs text-red-400">{errors.fuel_type.message}</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Current Mileage (KM)</label>
                            <input {...register('mileage')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="0" />
                            {errors.mileage && <p className="mt-1 text-xs text-red-400">{errors.mileage.message}</p>}
                        </div>
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
                            {loading ? 'Registering...' : 'Register Vehicle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddVehicle;
