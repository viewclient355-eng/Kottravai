import React, { useState } from 'react';
import { useProducts } from '@/context/ProductContext';
import { compressImage } from '@/utils/imageCompressor';
import { toast } from 'react-hot-toast';
import { Check, Loader2, Play, AlertCircle, RefreshCw } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';

const ImageOptimizer: React.FC = () => {
    const { products, updateProduct, fetchProducts } = useProducts();
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [stats, setStats] = useState({ totalSaved: 0, optimizedCount: 0 });

    const startBulkOptimization = async () => {
        if (!window.confirm(`This will re-process ${products.length} product images to WebP format. Continue?`)) return;

        setIsOptimizing(true);
        setStats({ totalSaved: 0, optimizedCount: 0 });
        setProgress({ current: 0, total: products.length });

        let savedBytes = 0;
        let count = 0;

        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            setProgress(prev => ({ ...prev, current: i + 1 }));

            try {
                // 1. Download current image
                const response = await fetch(product.image);
                const blob = await response.blob();
                const file = new File([blob], `product-${product.id}.jpg`, { type: blob.type });

                // 2. Compress
                const result = await compressImage(file);

                // 3. Upload back to Supabase (we'll reuse the uploadToSupabase logic via backend API)
                const formData = new FormData();
                formData.append('file', result.file);
                formData.append('path', 'products');

                const uploadResponse = await fetch(`${API_ENDPOINTS.storage}/upload`, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Authorization': `Bearer ${sessionStorage.getItem('kottravai_admin_token')}`
                    }
                });

                if (uploadResponse.ok) {
                    const { url } = await uploadResponse.json();
                    
                    // 4. Update Product in DB
                    await updateProduct({
                        ...product,
                        image: url
                    });

                    savedBytes += (result.originalSize - result.compressedSize);
                    count++;
                    setStats({ totalSaved: savedBytes, optimizedCount: count });
                }
            } catch (err) {
                console.error(`Failed to optimize product ${product.name}:`, err);
            }
        }

        setIsOptimizing(false);
        toast.success(`Successfully optimized ${count} images!`);
        fetchProducts(true); // Refresh data
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-[#2D1B4E] flex items-center gap-3">
                            <RefreshCw className={isOptimizing ? "animate-spin" : ""} />
                            Bulk Image Optimizer
                        </h2>
                        <p className="text-gray-500 mt-1">Re-process existing library images to WebP (max 300KB) to boost site performance.</p>
                    </div>
                    <button
                        onClick={startBulkOptimization}
                        disabled={isOptimizing || products.length === 0}
                        className="bg-[#8E2A8B] text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#722270] transition-all disabled:bg-gray-200 flex items-center gap-3 shadow-lg hover:shadow-[#8E2A8B]/30"
                    >
                        {isOptimizing ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <Play size={20} />
                        )}
                        {isOptimizing ? 'Optimizing...' : 'Start Global Optimization'}
                    </button>
                </div>

                {isOptimizing && (
                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center text-sm font-bold">
                            <span className="text-gray-500 italic">Processing image {progress.current} of {progress.total}</span>
                            <span className="text-[#8E2A8B]">{Math.round((progress.current / progress.total) * 100)}%</span>
                        </div>
                        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-[#8E2A8B] to-purple-500 transition-all duration-300"
                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Savings</p>
                        <h4 className="text-3xl font-black text-emerald-600">{(stats.totalSaved / 1024 / 1024).toFixed(2)} MB</h4>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Items Processed</p>
                        <h4 className="text-3xl font-black text-[#2D1B4E]">{stats.optimizedCount}</h4>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Estimated Speed Boost</p>
                        <h4 className="text-3xl font-black text-blue-600">~{Math.min(95, stats.optimizedCount * 2)}%</h4>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-[#2D1B4E] mb-6">Optimization Queue</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.slice(0, 20).map(product => (
                        <div key={product.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-50 hover:bg-gray-50 transition-colors">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                <img src={product.image} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-800 text-sm truncate">{product.name}</p>
                                <p className="text-[10px] text-gray-400 font-medium">
                                    {product.image.endsWith('.webp') ? (
                                        <span className="text-emerald-500 flex items-center gap-1"><Check size={10} /> WebP Ready</span>
                                    ) : (
                                        <span className="text-amber-500 flex items-center gap-1"><AlertCircle size={10} /> Needs Optimization</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    ))}
                    {products.length > 20 && (
                        <div className="col-span-full text-center p-4 text-gray-400 text-sm italic">
                            + {products.length - 20} more items in queue...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageOptimizer;
