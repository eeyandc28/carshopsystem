import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { ArchiveBoxIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const schema = yup.object({
    name: yup.string().required('Part name is required'),
    part_number: yup.string().required('Part number is required'),
    brand: yup.string().required('Brand is required'),
    supplier_id: yup.string().nullable(),
    stock_quantity: yup.number().typeError('Must be a number').required('Stock quantity is required'),
    reorder_level: yup.number().typeError('Must be a number').required('Reorder level is required'),
    unit_price: yup.number().typeError('Must be a number').required('Unit price is required'),
}).required();

const AddInventory = () => {
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const navigate = useNavigate();
    
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            // Need to create suppliers API if not exists, for now it might return empty
            const response = await api.get('/suppliers').catch(() => ({ data: { data: [] } }));
            setSuppliers(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch suppliers', error);
        }
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await api.post('/inventory', data);
            navigate('/inventory');
        } catch (error) {
            console.error('Failed to add inventory item', error);
            alert(error.response?.data?.message || 'Failed to add item');
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
                        <ArchiveBoxIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Add Inventory Item</h1>
                        <p className="text-slate-400 text-sm">Register a new spare part or material to stock.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Part Name</label>
                        <input {...register('name')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Oil Filter" />
                        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Part Number / SKU</label>
                            <input {...register('part_number')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="FLT-12345" />
                            {errors.part_number && <p className="mt-1 text-xs text-red-400">{errors.part_number.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Brand</label>
                            <input {...register('brand')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Genuine / Bosch" />
                            {errors.brand && <p className="mt-1 text-xs text-red-400">{errors.brand.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Initial Stock Quantity</label>
                            <input type="number" {...register('stock_quantity')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="0" />
                            {errors.stock_quantity && <p className="mt-1 text-xs text-red-400">{errors.stock_quantity.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Reorder Level (Alert)</label>
                            <input type="number" {...register('reorder_level')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="5" />
                            {errors.reorder_level && <p className="mt-1 text-xs text-red-400">{errors.reorder_level.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Unit Price ($)</label>
                            <input type="number" step="0.01" {...register('unit_price')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="0.00" />
                            {errors.unit_price && <p className="mt-1 text-xs text-red-400">{errors.unit_price.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Supplier (Optional)</label>
                            <select {...register('supplier_id')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none">
                                <option value="">Select Supplier</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
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
                            {loading ? 'Adding...' : 'Add Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddInventory;
