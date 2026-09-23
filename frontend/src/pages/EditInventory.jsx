import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import { ArchiveBoxIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const schema = yup.object({
    name: yup.string().required('Part name is required'),
    type: yup.string().nullable(),
    keyword: yup.string().nullable(),
    part_number: yup.string().required('Part number is required'),
    brand: yup.string().required('Brand is required'),
    supplier_id: yup.string().nullable().transform((v) => v === "" ? null : v),
    stock_quantity: yup.number().typeError('Must be a number').required('Stock quantity is required'),
    reorder_level: yup.number().typeError('Must be a number').required('Reorder level is required'),
    unit_price: yup.number().typeError('Must be a number').required('Unit price is required'),
    markup_rate: yup.number().typeError('Must be a number').nullable().transform((v, o) => o === '' || isNaN(v) ? 0 : v),
}).required();

const ITEM_TYPES = [
    'Part',
    'Labor',
    'Oil & Fluids',
    'Tire & Wheels',
    'Electrical',
    'Body & Paint',
    'Other',
];

const EditInventory = () => {
    const { id } = useParams();
    const [loading, setLoading]     = useState(false);
    const [fetching, setFetching]   = useState(true);
    const [suppliers, setSuppliers] = useState([]);
    const [itemTypes, setItemTypes] = useState([]);
    const navigate = useNavigate();
    
    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    const unitPrice = watch('unit_price');
    const markupRate = watch('markup_rate');
    const estSellingPrice = (parseFloat(unitPrice) || 0) * (1 + (parseFloat(markupRate) || 0) / 100);

    useEffect(() => {
        fetchInitialData();
        fetchItemTypes();
    }, [id]);

    const fetchItemTypes = async () => {
        try {
            const res = await api.get('/inventory-types');
            setItemTypes(res.data.data || []);
        } catch {
            console.error('Failed to fetch inventory types');
        }
    };

    const fetchInitialData = async () => {
        try {
            const [itemRes, suppliersRes] = await Promise.all([
                api.get(`/inventory/${id}`),
                api.get('/suppliers').catch(() => ({ data: { data: [] } }))
            ]);
            
            reset(itemRes.data.data);
            setSuppliers(suppliersRes.data.data || []);
        } catch (error) {
            console.error('Failed to fetch inventory data', error);
            alert('Failed to load inventory item');
            navigate('/inventory');
        } finally {
            setFetching(false);
        }
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await api.put(`/inventory/${id}`, data);
            navigate('/inventory');
        } catch (error) {
            console.error('Failed to update inventory item', error);
            alert(error.response?.data?.message || 'Failed to update item');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-8 text-white text-center">Loading inventory data...</div>;

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
                        <h1 className="text-2xl font-bold text-white">Edit Inventory Item</h1>
                        <p className="text-slate-400 text-sm">Update stock information for this part.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Part Name</label>
                        <input {...register('name')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Oil Filter" />
                        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                        <div className="relative">
                            <select
                                {...register('type')}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Select Type (optional)</option>
                                {itemTypes.map(t => (
                                    <option key={t.id} value={t.name}>{t.name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                        {errors.type && <p className="mt-1 text-xs text-red-400">{errors.type.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Keyword</label>
                        <input
                            {...register('keyword')}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder="e.g. filter, oil, engine, lubrication"
                        />
                        {errors.keyword && <p className="mt-1 text-xs text-red-400">{errors.keyword.message}</p>}
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
                            <label className="block text-sm font-medium text-slate-300 mb-2">Current Stock Quantity</label>
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
                            <label className="block text-sm font-medium text-slate-300 mb-2">Unit Price / Cost (₱)</label>
                            <input type="number" step="0.01" {...register('unit_price')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="0.00" />
                            {errors.unit_price && <p className="mt-1 text-xs text-red-400">{errors.unit_price.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Markup Rate (%)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    {...register('markup_rate')}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-8"
                                    placeholder="0.00"
                                />
                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">%</span>
                            </div>
                            {errors.markup_rate && <p className="mt-1 text-xs text-red-400">{errors.markup_rate.message}</p>}
                            {parseFloat(markupRate) > 0 && parseFloat(unitPrice) > 0 && (
                                <p className="mt-1.5 text-xs text-emerald-400">
                                    Est. Selling Price: ₱{estSellingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Supplier (Optional)</label>
                        <select {...register('supplier_id')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all">
                            <option value="">Select Supplier</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
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
                            {loading ? 'Saving...' : 'Update Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditInventory;
