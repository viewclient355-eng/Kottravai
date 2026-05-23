import { useRef, useMemo } from 'react';
import { useProducts } from '@/context/ProductContext';
import NewArrivalProductCard from './NewArrivalProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const NewArrivals = () => {
    const { products, categories } = useProducts();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Filter and Sort logic
    const displayProducts = useMemo(() => {
        // 0. Only show Live products
        let filtered = products.filter(p => p.isLive !== false);

        // 1. Sort by createdAt (newest first)
        // If createdAt is missing, treat as old
        filtered = [...filtered].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

        // 2. Interleave categories for variety
        const groups: { [key: string]: typeof filtered } = {};
        filtered.forEach(p => {
            const cat = p.category?.toLowerCase() || 'other';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(p);
        });

        const interleaved: typeof filtered = [];
        const categoryNames = Object.keys(groups);
        let hasMore = true;
        let index = 0;

        while (hasMore && interleaved.length < 24) {
            hasMore = false;
            for (const catName of categoryNames) {
                if (groups[catName][index]) {
                    interleaved.push(groups[catName][index]);
                    hasMore = true;
                }
            }
            index++;
        }

        // 3. Return max 24 items for "New Arrivals" to give more space for variety
        return interleaved.slice(0, 24);
    }, [products, categories]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const { scrollLeft, clientWidth } = scrollContainerRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
            scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    if (!products || products.length === 0) {
        return null;
    }

    return (
        <section className="pt-6 pb-4 bg-white">
            <div className="container mx-auto px-4 max-w-[1240px]">
                <div className="mb-6 px-4 flex flex-col md:flex-row md:items-center md:justify-between text-center md:text-left">
                    <div>
                        <h2 className="text-4xl md:text-6xl font-black text-[#1A1A1A] tracking-tight font-outfit">New Arrivals</h2>
                    </div>
                    <div className="mt-4 md:mt-0">
                        <a href="/shop" className="inline-flex items-center gap-2 text-sm font-bold text-[#8E2A8B] hover:underline uppercase tracking-wide">
                            View New Arrivals
                            <ChevronRight size={14} />
                        </a>
                    </div>
                </div>

                {/* Carousel Container */}
                {displayProducts.length > 0 ? (
                    <div className="relative group/carousel">
                        {/* Navigation Buttons */}
                        <button
                            onClick={() => scroll('left')}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 hover:bg-gray-50 border border-gray-100 hidden md:flex"
                        >
                            <ChevronLeft size={20} className="text-[#8E2A8B]" />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 hover:bg-gray-50 border border-gray-100 hidden md:flex"
                        >
                            <ChevronRight size={20} className="text-[#8E2A8B]" />
                        </button>

                        <div
                            ref={scrollContainerRef}
                            className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-4 md:gap-6 pb-4 -mx-4 px-4"
                        >
                            {displayProducts.map((product, index) => (
                                <div key={product.id} className="flex-shrink-0 w-[280px] sm:w-[320px] lg:w-[calc(25%-18px)] snap-start flex">
                                    <NewArrivalProductCard product={product} index={index} />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 bg-[#FAF9F6] rounded-[2rem] border border-dashed border-gray-200">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">New collections arriving soon.</p>
                    </div>
                )}

                {/* 'View All New Arrivals' moved to title area as small link */}
            </div>
        </section>
    );
};

export default NewArrivals;
