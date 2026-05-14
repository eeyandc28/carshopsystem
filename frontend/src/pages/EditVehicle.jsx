import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import { TruckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const schema = yup.object({
    customer_id: yup.string().required('Customer is required'),
    plate_number: yup.string().required('Plate number is required'),
    vin: yup.string().required('VIN is required'),
    brand: yup.string().required('Brand is required'),
    model: yup.string().required('Model is required'),
    year: yup.number().typeError('Must be a number').required('Year is required'),
    transmission: yup.string().required('Transmission is required'),
    fuel_type: yup.string().required('Fuel type is required'),
    mileage: yup.number().typeError('Must be a number').required('Mileage is required'),
    color: yup.string().required('Color is required'),
}).required();

const EditVehicle = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [customers, setCustomers] = useState([]);

    const { register, handleSubmit, formState: { errors }, reset } = useForm({
        resolver: yupResolver(schema)
    });

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [vRes, cRes] = await Promise.all([
                api.get(`/vehicles/${id}`),
                api.get('/customers')
            ]);
            setCustomers(cRes.data.data);
            const v = vRes.data.data;
            reset({
                customer_id: v.customer_id,
                plate_number: v.plate_number,
                vin: v.vin,
                brand: v.brand,
                model: v.model,
                year: v.year,
                transmission: v.transmission,
                fuel_type: v.fuel_type,
                mileage: v.mileage,
                color: v.color,
            });
        } catch (error) {
            console.error('Failed to fetch vehicle', error);
        } finally {
            setFetching(false);
        }
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await api.put(`/vehicles/${id}`, data);
            navigate('/vehicles');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update vehicle');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-8 text-white">Loading vehicle data...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <button onClick={() => navigate(-1)} className="flex items-center text-slate-400 hover:text-white transition-colors">
                <ArrowLeftIcon className="h-4 w-4 mr-2" /> Back
            </button>
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl">
                <div className="flex items-center space-x-4 mb-8 pb-6 border-b border-slate-800">
                    <div className="h-12 w-12 bg-amber-600/20 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
                        <TruckIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Edit Vehicle</h1>
                        <p className="text-slate-400 text-sm">Update vehicle information.</p>
                    </div>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Owner</label>
                        <select {...register('customer_id')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none">
                            <option value="">Select Customer</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                        </select>
                        {errors.customer_id && <p className="mt-1 text-xs text-red-400">{errors.customer_id.message}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Plate Number</label>
                            <input {...register('plate_number')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                            {errors.plate_number && <p className="mt-1 text-xs text-red-400">{errors.plate_number.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">VIN</label>
                            <input {...register('vin')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                            {errors.vin && <p className="mt-1 text-xs text-red-400">{errors.vin.message}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Brand</label>
                            <input {...register('brand')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                            {errors.brand && <p className="mt-1 text-xs text-red-400">{errors.brand.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Model</label>
                            <input {...register('model')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                            {errors.model && <p className="mt-1 text-xs text-red-400">{errors.model.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Year</label>
                            <input type="number" {...register('year')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                            {errors.year && <p className="mt-1 text-xs text-red-400">{errors.year.message}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Transmission</label>
                            <select {...register('transmission')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none">
                                <option value="Manual">Manual</option>
                                <option value="Automatic">Automatic</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Fuel Type</label>
                            <select {...register('fuel_type')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none">
                                <option value="Gasoline">Gasoline</option>
                                <option value="Diesel">Diesel</option>
                                <option value="Electric">Electric</option>
                                <option value="Hybrid">Hybrid</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Color</label>
                            <input {...register('color')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                            {errors.color && <p className="mt-1 text-xs text-red-400">{errors.color.message}</p>}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Mileage (KM)</label>
                        <input type="number" {...register('mileage')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                        {errors.mileage && <p className="mt-1 text-xs text-red-400">{errors.mileage.message}</p>}
                    </div>
                    <div className="pt-6 border-t border-slate-800 flex justify-end space-x-4">
                        <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all font-semibold">Cancel</button>
                        <button type="submit" disabled={loading} className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg shadow-blue-500/25 disabled:opacity-50">
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditVehicle;
