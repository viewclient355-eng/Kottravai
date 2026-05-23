import { Megaphone, Heart, Globe, Users } from 'lucide-react';

const props = [
    {
        title: "Empowers Rural Women",
        desc: "Every product is crafted by skilled women artisans, ensuring fair wages and sustained livelihoods.",
        Icon: Megaphone
    },
    {
        title: "Authentic Craftsmanship",
        desc: "Rooted in ancient design and modern aesthetics — each piece tells a story of culture and resilience.",
        Icon: Heart
    },
    {
        title: "Sustainable & Ethical",
        desc: "Thoughtful materials, earth-friendly packaging and zero compromise on values at every step.",
        Icon: Globe
    },
    {
        title: "Relationship-First",
        desc: "Hampers curated to express appreciation that is heartfelt, not transactional.",
        Icon: Users
    }
];

const ValueProps = () => {
    return (
        <section className="py-10 md:py-16 bg-[#F8F7FF]">
            <div className="container mx-auto px-4 max-w-[1240px]">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black text-[#1A1A1A] font-outfit mb-4">Why gift with Kottravai?</h2>
                    <div className="w-20 h-1.5 bg-[#8E2A8B] mx-auto rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                    {props.map((prop, index) => (
                        <div key={index} className="flex flex-col items-center text-center group">
                            {/* Icon Container with Gradient and Shadow */}
                            <div className="relative mb-6">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#8E2A8B] to-[#72216F] flex items-center justify-center text-white shadow-[0_10px_30px_-5px_rgba(142,42,139,0.3)] border-4 border-white transition-transform duration-500 group-hover:scale-110">
                                    <prop.Icon size={36} strokeWidth={1.5} />
                                </div>
                                
                                {/* Dotted Connector */}
                                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 h-8 border-l-2 border-dotted border-[#8E2A8B]/30"></div>
                            </div>

                            {/* Content */}
                            <div className="mt-4 px-2">
                                <h3 className="text-xl font-bold text-[#1A1A1A] mb-3 leading-tight font-outfit group-hover:text-[#8E2A8B] transition-colors">
                                    {prop.title}
                                </h3>
                                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                                    {prop.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ValueProps;
