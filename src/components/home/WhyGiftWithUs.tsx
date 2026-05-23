import { Megaphone, Award, Leaf, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const reasons = [
    {
        title: "Empowers Rural Women",
        description: "Every product is crafted by skilled women artisans, ensuring fair wages and sustained livelihoods.",
        Icon: Megaphone
    },
    {
        title: "Authentic Craftsmanship",
        description: "Rooted in ancient design and modern aesthetics — each piece tells a story of culture and resilience.",
        Icon: Award
    },
    {
        title: "Sustainable & Ethical",
        description: "Thoughtful materials, earth-friendly packaging and zero compromise on values at every step.",
        Icon: Leaf
    },
    {
        title: "Relationship-First",
        description: "Hampers curated to express appreciation that is heartfelt, not transactional.",
        Icon: Heart
    }
];

const WhyGiftWithUs = () => {
    return (
        <section className="py-6 md:py-10 bg-[#FAF9F6] overflow-hidden">
            <div className="container mx-auto px-4 max-w-[1240px]">
                {/* Standardized Header */}
                <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-4 mb-2">
                        <span className="text-[#8E2A8B] font-bold tracking-[0.3em] uppercase text-[10px]">Why Us</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-[#2D1B4E] leading-[1.1] mb-4 font-outfit tracking-tighter">
                        Why Gift with <span className="text-[#8E2A8B]">Kottravai?</span>
                    </h2>
                </div>

                {/* Reasons Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {reasons.map((reason, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-xl p-8 flex flex-col items-center text-center shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.08)] transition-all duration-500 group border border-gray-50 h-full"
                        >
                            {/* Icon Container */}
                            <div className="w-20 h-20 rounded-full bg-[#8E2A8B]/5 flex items-center justify-center text-[#8E2A8B] mb-4 group-hover:scale-110 transition-transform duration-500">
                                <reason.Icon size={32} strokeWidth={1.5} />
                            </div>
                            
                            {/* Gradient Divider */}
                            <div className="w-10 h-[3px] bg-gradient-to-r from-transparent via-[#8E2A8B] to-transparent mb-4"></div>
                            
                            <h3 className="text-xl font-bold text-[#2D1B4E] mb-2 leading-tight">
                                {reason.title}
                            </h3>
                            
                            <p className="text-gray-500 text-sm leading-relaxed font-medium">
                                {reason.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WhyGiftWithUs;
