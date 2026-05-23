import { Store, ShoppingCart, ShoppingBag, Flower2, Gift, Warehouse, Globe } from 'lucide-react';

const partners = [
    { name: "Rural Stores", Icon: Store },
    { name: "Online Sellers", Icon: ShoppingCart },
    { name: "Boutiques", Icon: ShoppingBag },
    { name: "Spas & Salons", Icon: Flower2 },
    { name: "Corporate Gifting", Icon: Gift },
    { name: "Distributors", Icon: Warehouse },
    { name: "Exporters", Icon: Globe }
];

const PartnerSection = () => {
    return (
        <section className="pb-6 md:pb-8 pt-4 md:pt-6 bg-white overflow-hidden">
            <div className="container mx-auto px-4 max-w-[1240px]">
                {/* Standardized Header */}
                <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-4 mb-2">
                        <span className="text-[#8E2A8B] font-bold tracking-[0.3em] uppercase text-[10px]">Who We Work With</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-[#2D1B4E] leading-[1.1] mb-4 font-outfit tracking-tighter">
                        Who We <span className="text-[#8E2A8B]">Work With</span>
                    </h2>
                </div>

                {/* Partners Running Carousel (Marquee) */}
                <div className="relative overflow-hidden w-full py-4 -mx-4 px-4">
                    {/* Edge Fades for premium transition effect */}
                    <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none"></div>

                    {/* Infinite Marquee flex container */}
                    <div className="flex animate-marquee gap-6 w-max">
                        {/* First set of partners */}
                        {partners.map((partner, index) => (
                            <div
                                key={`partner-set1-${index}`}
                                className="w-[180px] flex-shrink-0 bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center text-center shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition-all duration-500 group h-full"
                            >
                                {/* Icon Container */}
                                <div className="w-16 h-16 rounded-full bg-[#8E2A8B]/5 flex items-center justify-center text-[#8E2A8B] mb-6 group-hover:scale-110 transition-transform duration-500">
                                    <partner.Icon size={28} strokeWidth={1.5} />
                                </div>
                                
                                {/* Divider Line */}
                                <div className="w-6 h-[2px] bg-[#8E2A8B]/20 mb-4 group-hover:w-10 transition-all duration-500"></div>
                                
                                <h3 className="text-[13px] font-bold text-[#2D1B4E] leading-tight group-hover:text-[#8E2A8B] transition-colors">
                                    {partner.name}
                                </h3>
                            </div>
                        ))}

                        {/* Second set of partners for loop continuity */}
                        {partners.map((partner, index) => (
                            <div
                                key={`partner-set2-${index}`}
                                className="w-[180px] flex-shrink-0 bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center text-center shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition-all duration-500 group h-full"
                            >
                                {/* Icon Container */}
                                <div className="w-16 h-16 rounded-full bg-[#8E2A8B]/5 flex items-center justify-center text-[#8E2A8B] mb-6 group-hover:scale-110 transition-transform duration-500">
                                    <partner.Icon size={28} strokeWidth={1.5} />
                                </div>
                                
                                {/* Divider Line */}
                                <div className="w-6 h-[2px] bg-[#8E2A8B]/20 mb-4 group-hover:w-10 transition-all duration-500"></div>
                                
                                <h3 className="text-[13px] font-bold text-[#2D1B4E] leading-tight group-hover:text-[#8E2A8B] transition-colors">
                                    {partner.name}
                                </h3>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PartnerSection;
