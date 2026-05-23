import { Play } from 'lucide-react';

const FeaturedMedia = () => {
    return (
        <section className="pt-4 pb-6 bg-white overflow-hidden">
            <div className="container mx-auto px-4 max-w-[1240px]">
                
                {/* Mobile Heading - Only visible on small screens */}
                <div className="lg:hidden mb-8">
                    <h2 className="text-4xl font-black text-[#1A1A1A] leading-[1.1] tracking-tight">
                        Featured on <br />
                        <span className="text-[#8E2A8B]">National Television</span>
                    </h2>
                </div>

                <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                    
                    {/* Image Section - Comes second on mobile, Right on desktop */}
                    <div className="w-full lg:w-1/2 order-2 lg:order-2 relative group">
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-100">
                            <img 
                                src="/featured-vijay-tv.jpg" 
                                alt="Kottravai featured on Startup Singam - Vijay TV" 
                                width={996}
                                height={494}
                                className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none opacity-60 transition-opacity"></div>
                        </div>
                    </div>

                    {/* Content Section - Heading hidden on mobile (already shown above image) */}
                    <div className="w-full lg:w-1/2 order-3 lg:order-1 space-y-8">
                        <div className="hidden lg:block space-y-4">
                            <h2 className="text-6xl font-black text-[#1A1A1A] leading-[1.1] tracking-tight">
                                Featured on <br />
                                <span className="text-[#8E2A8B]">National Television</span>
                            </h2>
                        </div>
                        
                        <div className="space-y-6">
                            <p className="text-lg md:text-xl text-gray-600 leading-relaxed font-semibold">
                                Kottravai was proudly featured on <span className="text-[#1A1A1A] font-black">Startup Singam on Vijay Television</span> — recognizing our journey in bringing handmade products and traditional mixes to a wider audience.
                            </p>
                            <p className="text-gray-500 leading-relaxed font-medium">
                                This milestone reflects our commitment to quality, consistency, and customer trust. We are honored to share our passion for Indian heritage with millions of viewers across the nation.
                            </p>
                        </div>

                        <div className="pt-4">
                            <a 
                                href="https://jiohotstar.com/1700102025?utm_source=share" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="group relative inline-flex items-center gap-4 px-10 py-5 bg-[#1A1A1A] text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-[#8E2A8B] transition-all duration-500 shadow-2xl shadow-black/20 hover:shadow-[#8E2A8B]/30 hover:-translate-y-1 active:scale-95 w-full md:w-auto justify-center"
                            >
                                <span className="relative z-10">View our episode</span>
                                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                    <Play size={14} fill="currentColor" />
                                </div>
                            </a>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default FeaturedMedia;
