import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { TruckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const schema = yup.object({
    name: yup.string().required('Supplier name is required'),
    contact_person: yup.string().nullable(),
    contact_number: yup.string().nullable(),
    email: yup.string().email('Must be a valid email').nullable(),
}).required();

const AddSupplier = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await api.post('/suppliers', data);
            // Navigate back to the previous page or a specific page
            navigate(-1);
        } catch (error) {
            console.error('Failed to add supplier', error);
            alert(error.response?.data?.message || 'Failed to add supplier');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
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
                        <h1 className="text-2xl font-bold text-white">Add Supplier</h1>
                        <p className="text-slate-400 text-sm">Register a new supplier for your inventory.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Supplier Name</label>
                        <input {...register('name')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Auto Parts Co." />
                        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Contact Person</label>
                            <input {...register('contact_person')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="John Doe" />
                            {errors.contact_person && <p className="mt-1 text-xs text-red-400">{errors.contact_person.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Contact Number</label>
                            <input {...register('contact_number')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="+1 234 567 8900" />
                            {errors.contact_number && <p className="mt-1 text-xs text-red-400">{errors.contact_number.message}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                        <input type="email" {...register('email')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="contact@supplier.com" />
                        {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
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
                            {loading ? 'Adding...' : 'Add Supplier'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSupplier;
