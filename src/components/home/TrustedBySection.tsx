import { motion } from 'framer-motion';

const clients = [
    { name: "Aram", logo: "/WhatsApp Image 2026-05-15 at 4.58.43 PM.jpeg" },
    { name: "Raphael Creatives", logo: "/raphael.jpeg" },
    { name: "Iyanthiram", logo: "/iyanthiran.jpeg" },
    { name: "Iragu Events", logo: "/iragu.jpeg" },
    { name: "Sprint 6", logo: "/sprint.jpeg" },
    { name: "Franchise Bhoomi", logo: "/franchise.jpeg" },
    { name: "Startup Singam", logo: "/startupsingam.jpeg" },
    { name: "Spikra", logo: "/kk.png" } // Placeholder for Spikra
];

const TrustedBySection = () => {
    return (
        <section className="pb-8 md:pb-12 pt-0 bg-white overflow-hidden">
            <div className="container mx-auto px-4 max-w-[1240px]">
                {/* Standardized Header */}
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-4 mb-2">
                        <span className="text-[#8E2A8B] font-bold tracking-[0.3em] uppercase text-[10px]">B2B Clients</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-[#2D1B4E] leading-[1.1] mb-4 font-outfit tracking-tighter">
                        Trusted <span className="text-[#8E2A8B]">By</span>
                    </h2>
                </div>

                {/* Logos Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                    {clients.map((client, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-xl border border-gray-100 p-6 flex items-center justify-center h-32 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-500 group"
                        >
                            <img 
                                src={client.logo} 
                                alt={client.name}
                                className="max-w-full max-h-full object-contain transition-all duration-500"
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TrustedBySection;
