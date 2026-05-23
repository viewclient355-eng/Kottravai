import React, { useMemo } from 'react';
import { useProducts } from '@/context/ProductContext';
import ProductCard from './ProductCard';
import { ShoppingBag, Leaf, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const InstantNourishFeature: React.FC = () => {
    const { products, loading } = useProducts();

    const featuredProducts = useMemo(() => {
        if (!products || products.length === 0) return [];
        return products
            .filter(p => p.isLive !== false && (p.category === 'Instant Nourish' || p.categorySlug === 'instant-nourish'))
            .slice(0, 4);
    }, [products]);

    if (!loading && featuredProducts.length === 0) return null;

    // Use the first featured product as the hero highlight
    const heroProduct = featuredProducts[0];

    return (
        <section className="py-12 md:py-20 bg-white overflow-hidden">
            <div className="container mx-auto px-4 max-w-[1240px]">
                
                {/* --- HERO SECTION (TOP) --- */}
                <div className="relative rounded-[2.5rem] overflow-hidden mb-12 bg-[#2D2D2D] text-white">
                    {/* Background Split */}
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-[#8E2A8B]/90 hidden lg:block"></div>
                    
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-center">
                        {/* Left Side Content */}
                        <div className="lg:col-span-7 p-8 md:p-16">
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-white text-[10px] font-black uppercase tracking-[0.3em] mb-8 backdrop-blur-md">
                                <ShieldCheck size={14} className="text-[#8E2A8B]" /> Tradition Meets Speed
                            </span>
                            
                            <h2 className="text-5xl md:text-7xl font-black mb-6 leading-[1] tracking-tighter uppercase font-outfit">
                                Instant <br />
                                <span className="text-[#8E2A8B]">Nourish</span>
                            </h2>
                            
                            <p className="text-gray-300 text-lg md:text-xl font-medium mb-10 max-w-[500px] leading-relaxed">
                                Delicious, nutrient-dense traditional Indian meals ready in minutes. No preservatives, just pure grains.
                            </p>

                            <div className="flex flex-wrap gap-8 items-center mb-12">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center">
                                        <Leaf size={18} className="text-[#8E2A8B]" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-white/60">100% Organic</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center font-black text-[10px]">3k+</div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-white/60">Happy Customers</span>
                                </div>
                            </div>

                            <Link 
                                to="/category/instant-nourish"
                                className="inline-flex items-center gap-3 px-10 py-5 bg-white text-[#1A1A1A] font-black text-[12px] uppercase tracking-[0.2em] rounded-full hover:bg-[#8E2A8B] hover:text-white transition-all transform hover:-translate-y-1 shadow-2xl"
                            >
                                Shop The Collection <ShoppingBag size={18} />
                            </Link>
                        </div>

                        {/* Right Side Hero Image */}
                        <div className="lg:col-span-5 relative h-[400px] lg:h-[600px] flex items-center justify-center p-8 bg-[#8E2A8B] lg:bg-transparent">
                            {/* Floating Discount Badge */}
                            <div className="absolute top-12 left-12 lg:-left-12 w-32 h-32 rounded-full bg-white flex flex-col items-center justify-center border-[8px] border-[#8E2A8B] shadow-2xl z-20 group hover:scale-110 transition-transform duration-500">
                                <span className="text-[#1A1A1A] text-2xl font-black leading-none">35%</span>
                                <span className="text-[#8E2A8B] text-[10px] font-black uppercase tracking-widest">OFF</span>
                            </div>

                            {heroProduct && (
                                <img 
                                    src={heroProduct.image} 
                                    alt="Featured Hero" 
                                    className="w-full h-full lg:w-[120%] lg:max-w-none lg:absolute lg:left-[-10%] object-contain drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)] transition-transform duration-700 hover:scale-105"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* --- PRODUCT GRID (BOTTOM) --- */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {loading ? (
                        [...Array(4)].map((_, i) => (
                            <div key={i} className="aspect-[3/4] bg-gray-50 animate-pulse rounded-3xl border border-gray-100"></div>
                        ))
                    ) : (
                        featuredProducts.map((product) => (
                            <div key={product.id} className="group">
                                <ProductCard product={product} />
                            </div>
                        ))
                    )}
                </div>

            </div>
        </section>
    );
};

export default InstantNourishFeature;
