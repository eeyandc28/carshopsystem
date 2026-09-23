import { useState, useRef } from 'react';
import { CameraIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

const CameraCaptureInput = ({ 
    label = 'Capture / Upload Photo', 
    onFileSelect, 
    previewUrl = null,
    onClear = null,
    hint = 'Take a photo with your device camera or pick from gallery'
}) => {
    const [preview, setPreview] = useState(previewUrl);
    const cameraInputRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreview(url);
            if (onFileSelect) {
                onFileSelect(file, url);
            }
        }
    };

    const handleRemove = () => {
        setPreview(null);
        if (cameraInputRef.current) cameraInputRef.current.value = '';
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (onClear) onClear();
    };

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
            )}

            {/* Hidden native inputs */}
            {/* 1. Camera Direct Capture (environment camera) */}
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* 2. File picker / Gallery */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />

            {preview ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 group">
                    <img 
                        src={preview} 
                        alt="Preview" 
                        className="w-full h-48 md:h-64 object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => cameraInputRef.current?.click()}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-500 transition-all flex items-center gap-1.5"
                        >
                            <CameraIcon className="h-4 w-4" />
                            Retake
                        </button>
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="px-3 py-1.5 bg-red-600/80 text-white rounded-lg text-xs font-semibold hover:bg-red-500 transition-all flex items-center gap-1.5"
                        >
                            <XMarkIcon className="h-4 w-4" />
                            Remove
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-slate-300 hover:text-white transition-colors"
                        title="Remove photo"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <div className="p-4 border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-2xl bg-slate-900/50 transition-colors text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <button
                            type="button"
                            onClick={() => cameraInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                        >
                            <CameraIcon className="h-4 w-4" />
                            <span>Take Photo</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all active:scale-95"
                        >
                            <PhotoIcon className="h-4 w-4 text-slate-400" />
                            <span>Choose File</span>
                        </button>
                    </div>
                    {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
                </div>
            )}
        </div>
    );
};

export default CameraCaptureInput;
