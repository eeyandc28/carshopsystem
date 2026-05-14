import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import { ClipboardDocumentListIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const schema = yup.object({
    description: yup.string().required('Description is required'),
    diagnosis: yup.string().nullable(),
    repair_action: yup.string().nullable(),
    status: yup.string().required('Status is required'),
    estimated_cost: yup.number().typeError('Must be a number').nullable(),
    actual_cost: yup.number().typeError('Must be a number').nullable(),
    promised_at: yup.string().nullable(),
}).required();

const EditJobOrder = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [order, setOrder] = useState(null);
    const navigate = useNavigate();
    
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            const response = await api.get(`/job-orders/${id}`);
            const data = response.data.data;
            setOrder(data);
            
            // Format date for input type="date"
            const promisedAt = data.promised_at ? new Date(data.promised_at).toISOString().split('T')[0] : '';
            
            reset({
                ...data,
                promised_at: promisedAt
            });
        } catch (error) {
            console.error('Failed to fetch job order', error);
            alert('Failed to load job order');
            navigate('/job-orders');
        } finally {
            setFetching(false);
        }
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await api.patch(`/job-orders/${id}`, data);
            navigate(`/job-orders/${id}`);
        } catch (error) {
            console.error('Failed to update job order', error);
            alert(error.response?.data?.message || 'Failed to update job order');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-8 text-white text-center">Loading job order...</div>;

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
                        <h1 className="text-2xl font-bold text-white">Edit Job Order: {order?.order_number}</h1>
                        <p className="text-slate-400 text-sm">Update service details and status.</p>
                    </div>
                </div>

                <div className="mb-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700 flex flex-wrap gap-6">
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Customer</p>
                        <p className="text-white font-medium">{order?.customer?.full_name}</p>
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Vehicle</p>
                        <p className="text-white font-medium">{order?.vehicle?.plate_number} ({order?.vehicle?.brand} {order?.vehicle?.model})</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                            <select 
                                {...register('status')} 
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                            >
                                <option value="pending">Pending</option>
                                <option value="diagnosing">Diagnosing</option>
                                <option value="waiting_for_parts">Waiting for Parts</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="released">Released</option>
                            </select>
                            {errors.status && <p className="mt-1 text-xs text-red-400">{errors.status.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Promised Delivery Date</label>
                            <input 
                                type="date" 
                                {...register('promised_at')} 
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Customer Complaint / Description</label>
                        <textarea 
                            {...register('description')} 
                            rows="3" 
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                        ></textarea>
                        {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Technical Diagnosis</label>
                        <textarea 
                            {...register('diagnosis')} 
                            rows="3" 
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                            placeholder="Detailed technical assessment..."
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Repair Action Taken</label>
                        <textarea 
                            {...register('repair_action')} 
                            rows="3" 
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                            placeholder="What was fixed and how..."
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Estimated Cost ($)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                {...register('estimated_cost')} 
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Actual Cost ($)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                {...register('actual_cost')} 
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                            />
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
                            {loading ? 'Saving...' : 'Update Job Order'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditJobOrder;
