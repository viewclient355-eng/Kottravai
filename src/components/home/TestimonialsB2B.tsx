import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
    {
        name: "Kaliappan K",
        role: "FOUNDER, SPRINT 6 & NAMMALOO",
        content: "Kottravai has been a reliable B2B partner for us. Their coconut shell products stand out for quality, consistency, and premium finish. Our corporate clients appreciated the sustainability angle, and repeat orders came in quickly",
        image: "/b1.jpeg",
        rating: 4.5
    },
    {
        name: "Jaya Shakthi",
        role: "FOUNDER, CDIX",
        content: "Working with Kottravai has been seamless. From sampling to bulk delivery, their team maintained quality and timelines. The handcrafted coconut shell products added a unique, eco-conscious value to our corporate gifting range.",
        image: "/b2.jpeg",
        rating: 4
    },
    {
        name: "Radha Lakshmi",
        role: "CEO, SPIKRA",
        content: "Kottravai’s terracotta jewellery reflects responsible craftsmanship. The natural materials, artisan-led production, and ethical sourcing aligned perfectly with our sustainability goals.",
        image: "/b3.jpeg",
        rating: 4.5
    }
];

const TestimonialsB2B = () => {
    return (
        <section className="py-6 md:py-12 bg-white overflow-hidden">
            <div className="container mx-auto px-4 max-w-[1240px]">
                {/* Standardized Header */}
                <div className="text-center mb-6 md:mb-10">
                    <div className="flex items-center justify-center gap-4 mb-2">
                        <span className="text-[#8E2A8B] font-bold tracking-[0.3em] uppercase text-[10px]">Testimonials</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-[#2D1B4E] leading-[1.1] mb-4 font-outfit tracking-tighter">
                        Loved by Our <span className="text-[#8E2A8B]">Community</span>
                    </h2>
                </div>

                {/* Testimonials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-xl border border-gray-100 p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.08)] transition-all duration-500 flex flex-col items-center text-center group"
                        >
                            {/* Profile Image */}
                            <div className="w-64 h-64 rounded-xl overflow-hidden mb-4 shadow-md border-4 border-white transform group-hover:scale-105 transition-transform duration-500">
                                <img 
                                    src={item.image} 
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Stars */}
                            <div className="flex gap-1 mb-3">
                                {[...Array(5)].map((_, i) => {
                                    const starValue = i + 1;
                                    if ((item.rating || 5) >= starValue) {
                                        return <Star key={i} size={18} fill="#8E2A8B" className="text-[#8E2A8B]" />;
                                    } else if ((item.rating || 5) >= starValue - 0.5) {
                                        return (
                                            <div key={i} className="relative">
                                                <Star size={18} className="text-gray-300" />
                                                <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
                                                    <Star size={18} fill="#8E2A8B" className="text-[#8E2A8B]" />
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        return <Star key={i} size={18} className="text-gray-300" />;
                                    }
                                })}
                            </div>

                            {/* Name & Role */}
                            <div className="mb-3">
                                <h3 className="text-xl font-bold text-[#2D1B4E] mb-2">{item.name}</h3>
                                <p className="text-[#8E2A8B] text-[10px] font-black uppercase tracking-widest opacity-80">
                                    {item.role}
                                </p>
                            </div>

                            {/* Content */}
                            <p className="text-gray-500 text-sm leading-relaxed italic font-medium">
                                "{item.content}"
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TestimonialsB2B;
