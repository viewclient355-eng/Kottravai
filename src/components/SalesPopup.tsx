import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import axios from 'axios';
import { getOptimizedImage, IMAGE_SIZES } from '@/utils/imageOptimizer';
import { API_ENDPOINTS } from '@/config/api';

interface Sale {
    name: string;
    city: string;
    productName: string;
    productImage: string;
    createdAt: string;
}

const SalesPopup: React.FC = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [isClosedManually, setIsClosedManually] = useState(false);

    useEffect(() => {
        const fetchSales = async () => {
            try {
                const response = await axios.get(API_ENDPOINTS.recentSales);
                if (response.data && response.data.length > 0) {
                    setSales(response.data);
                }
            } catch (err) {
                console.error("Failed to fetch recent sales", err);
            }
        };

        fetchSales();
    }, []);

    useEffect(() => {
        if (sales.length === 0 || isClosedManually) return;

        const cyclePopup = () => {
            // 1. Show the popup
            setIsVisible(true);

            // 2. Hide after 10 seconds
            setTimeout(() => {
                setIsVisible(false);
                
                // 3. Prepare next index after it fades out
                setTimeout(() => {
                    setCurrentIndex((prev) => (prev + 1) % sales.length);
                }, 1000);

            }, 10000);
        };

        // Initial trigger after 10 seconds
        const initialTimer = setTimeout(cyclePopup, 10000);

        // Repeat every 130 seconds (10s show + 120s gap)
        const interval = setInterval(cyclePopup, 130000);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, [sales, isClosedManually]);

    if (sales.length === 0 || isClosedManually) return null;

    const currentSale = sales[currentIndex];

    // Helper for "time ago"
    const getTimeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = Math.floor(seconds / 31536000);
        if (interval > 1) return `${interval} years ago`;
        interval = Math.floor(seconds / 2592000);
        if (interval > 1) return `${interval} months ago`;
        interval = Math.floor(seconds / 86400);
        if (interval > 1) return `${interval} days ago`;
        interval = Math.floor(seconds / 3600);
        if (interval > 1) return `${interval} hours ago`;
        interval = Math.floor(seconds / 60);
        if (interval > 1) return `${interval} minutes ago`;
        return `just now`;
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    className="fixed bottom-6 left-6 z-[999] flex items-stretch max-w-[340px] md:max-w-[420px] bg-white rounded-lg shadow-2xl overflow-hidden"
                >
                    {/* Left Side: Product Image with Clean White Background */}
                    <div className="w-[100px] md:w-[130px] flex-shrink-0 bg-white flex items-center justify-center p-2 relative">
                        <img
                            src={getOptimizedImage(currentSale.productImage, IMAGE_SIZES.THUMBNAIL)}
                            alt={currentSale.productName}
                            className="w-full h-full object-contain drop-shadow-md transform hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = '/logo.png';
                            }}
                        />
                    </div>

                    {/* Right Side: Content with Pink Background */}
                    <div className="flex-1 bg-[#8E2A8B] p-4 pr-10 relative flex flex-col justify-center min-h-[100px]">
                        <button
                            onClick={() => setIsClosedManually(true)}
                            className="absolute top-2 right-2 text-white/60 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <p className="text-white text-[13px] md:text-[15px] font-medium leading-snug mb-1">
                            {currentSale.name} from <span className="font-bold">{currentSale.city}</span> purchased
                        </p>
                        <h4 className="text-white text-[14px] md:text-[16px] font-extrabold leading-tight mb-3 line-clamp-1">
                            {currentSale.productName}
                        </h4>
                        <p className="text-white/80 text-[11px] md:text-[12px] font-black uppercase tracking-widest">
                            {getTimeAgo(currentSale.createdAt)}
                        </p>
                    </div>

                    {/* Verified Link/Icon (Optional Aesthetic) */}
                    <div className="absolute -bottom-1 -right-1 opacity-10 pointer-events-none">
                        <img src="/logo.png" alt="" className="w-12 h-12 grayscale invert" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SalesPopup;
