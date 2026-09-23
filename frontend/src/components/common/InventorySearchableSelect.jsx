import { useState, useRef, useEffect } from 'react';
import { ChevronUpDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

const InventorySearchableSelect = ({
    inventories = [],
    value = '',
    onChange,
    placeholder = 'Search by keyword or item...',
    error = '',
    disabled = false
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedItem = inventories.find(i => String(i.id) === String(value));

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter by keyword, name, or part_number
    const query = searchQuery.trim().toLowerCase();
    const filteredInventories = inventories.filter(inv => {
        if (!query) return true;
        const nameMatch = inv.name && inv.name.toLowerCase().includes(query);
        const keyMatch = inv.keyword && inv.keyword.toLowerCase().includes(query);
        const partMatch = inv.part_number && inv.part_number.toLowerCase().includes(query);
        return nameMatch || keyMatch || partMatch;
    });

    const handleSelect = (inv) => {
        onChange(String(inv.id));
        setSearchQuery('');
        setIsOpen(false);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
        setSearchQuery('');
        setIsOpen(true);
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="relative flex items-center">
                <input
                    type="text"
                    disabled={disabled}
                    className={`w-full px-3 pr-16 py-2 bg-slate-800 border rounded-lg text-white text-sm outline-none transition-all placeholder-slate-500 ${
                        error ? 'border-red-500/60 focus:ring-2 focus:ring-red-500' : 'border-slate-700 focus:ring-2 focus:ring-blue-500'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder={selectedItem ? selectedItem.name : placeholder}
                    value={isOpen ? searchQuery : (selectedItem ? selectedItem.name : '')}
                    onFocus={() => {
                        if (!disabled) setIsOpen(true);
                    }}
                    onClick={() => {
                        if (!disabled) setIsOpen(true);
                    }}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            if (isOpen && filteredInventories.length === 1) {
                                handleSelect(filteredInventories[0]);
                            }
                        } else if (e.key === 'Escape') {
                            setIsOpen(false);
                            setSearchQuery('');
                        }
                    }}
                />

                <div className="absolute right-2 flex items-center gap-1">
                    {(value || searchQuery) && !disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                            title="Clear"
                        >
                            <XMarkIcon className="h-3.5 w-3.5" />
                        </button>
                    )}
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                            if (!disabled) setIsOpen(!isOpen);
                        }}
                        className="p-1 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronUpDownIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Floating Dropdown List */}
            {isOpen && !disabled && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto min-w-[280px]">
                    {filteredInventories.length === 0 ? (
                        <div className="p-3 text-xs text-slate-400 text-center">
                            No items found matching &quot;{searchQuery}&quot;.
                        </div>
                    ) : (
                        <div className="py-1 divide-y divide-slate-800">
                            {filteredInventories.map(inv => {
                                const isSelected = String(inv.id) === String(value);
                                return (
                                    <div
                                        key={inv.id}
                                        onClick={() => handleSelect(inv)}
                                        className={`px-3 py-2 cursor-pointer flex items-center justify-between transition-colors ${
                                            isSelected ? 'bg-blue-600/20 text-blue-300' : 'hover:bg-slate-800 text-white'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden pr-2">
                                            <span className="text-sm font-medium truncate">{inv.name}</span>
                                            {inv.keyword && (
                                                <span className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-mono flex-shrink-0">
                                                    [{inv.keyword}]
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-2">
                                            <span className="text-xs font-semibold text-white block">
                                                ₱{parseFloat(inv.unit_price || 0).toLocaleString()}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                Stock: {inv.stock_quantity ?? 0}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default InventorySearchableSelect;
