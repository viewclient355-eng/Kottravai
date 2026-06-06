import { useEffect, useState, useRef } from 'react';
import { HeartHandshake, PackageOpen, Sparkles, Briefcase, Heart, CalendarCheck, Globe, Store, ChevronRight, ChevronLeft } from 'lucide-react';
import analytics from '@/utils/analyticsService';

const B2BSolutions = () => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleCardClick = (scenarioName: string) => {
        analytics.trackEvent('b2b_solution_card_view', { scenario: scenarioName });
    };

    const handleCtaClick = (ctaName: string, eventName: string) => {
        analytics.trackEvent(eventName, { cta: ctaName });
        const formElement = document.getElementById('contact-form');
        if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            const scrollAmount = current.clientWidth > 768 ? 400 : current.clientWidth * 0.8;
            current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    const scenarios = [
        {
            title: "Employee Appreciation",
            problem: "Generic gifts feel impersonal.",
            solution: "Curated gift hampers featuring handmade, sustainable products.",
            cta: "Explore Combos",
            icon: HeartHandshake,
            image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=500&auto=format&fit=crop",
            bgColor: "bg-pink-50",
            iconColor: "text-pink-600",
            eventName: "corporate_gifting_inquiry"
        },
        {
            title: "Employee Welcome Kits",
            problem: "Onboarding kits don't create excitement.",
            solution: "Custom welcome kits with artisan-made items & branding.",
            cta: "Build Kits",
            icon: PackageOpen,
            image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=500&auto=format&fit=crop",
            bgColor: "bg-blue-50",
            iconColor: "text-blue-600",
            eventName: "corporate_gifting_inquiry"
        },
        {
            title: "Corporate Festivals",
            problem: "Struggling to find premium gifts for seasons.",
            solution: "Diwali, Pongal, and New Year hampers in bulk.",
            cta: "View Festive",
            icon: Sparkles,
            image: "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?q=80&w=500&auto=format&fit=crop",
            bgColor: "bg-amber-50",
            iconColor: "text-amber-600",
            eventName: "corporate_gifting_inquiry"
        },
        {
            title: "Client Appreciation",
            problem: "Need gifts to strengthen relationships.",
            solution: "Premium artisan boxes for client retention.",
            cta: "Request Catalogue",
            icon: Briefcase,
            image: "https://images.unsplash.com/photo-1556761175-4b46a572b786?q=80&w=500&auto=format&fit=crop",
            bgColor: "bg-indigo-50",
            iconColor: "text-indigo-600",
            eventName: "corporate_gifting_inquiry"
        },
        {
            title: "Wedding Return Gifts",
            problem: "Need memorable gifts guests will value.",
            solution: "Elegant handmade collections with custom packaging.",
            cta: "Explore Wedding",
            icon: Heart,
            image: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=500&auto=format&fit=crop",
            bgColor: "bg-rose-50",
            iconColor: "text-rose-600",
            eventName: "wedding_gift_inquiry"
        },
        {
            title: "Event Giveaways",
            problem: "Most event giveaways are discarded.",
            solution: "Useful, sustainable products for corporate events.",
            cta: "View Solutions",
            icon: CalendarCheck,
            image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=500&auto=format&fit=crop",
            bgColor: "bg-emerald-50",
            iconColor: "text-emerald-600",
            eventName: "corporate_gifting_inquiry"
        },
        {
            title: "CSR Procurement",
            problem: "Budget must create measurable impact.",
            solution: "Every order supports rural women entrepreneurs.",
            cta: "Partner With Us",
            icon: Globe,
            image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=500&auto=format&fit=crop",
            bgColor: "bg-teal-50",
            iconColor: "text-teal-600",
            eventName: "csr_partnership_inquiry"
        },
        {
            title: "Retail Partnerships",
            problem: "Need unique products to stand out.",
            solution: "Wholesale pricing, custom sourcing, and artisan collections.",
            cta: "Become Partner",
            icon: Store,
            image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=500&auto=format&fit=crop",
            bgColor: "bg-purple-50",
            iconColor: "text-purple-600",
            eventName: "retail_partner_inquiry"
        }
    ];

    // Animated Statistics
    const [counts, setCounts] = useState({ women: 0, artisans: 0, products: 0, clients: 0 });

    useEffect(() => {
        const targetCounts = { women: 500, artisans: 50, products: 100000, clients: 200 };
        const duration = 2000;
        const frames = 60;
        const step = duration / frames;

        let frame = 0;
        const timer = setInterval(() => {
            frame++;
            const progress = frame / frames;
            setCounts({
                women: Math.floor(targetCounts.women * progress),
                artisans: Math.floor(targetCounts.artisans * progress),
                products: Math.floor(targetCounts.products * progress),
                clients: Math.floor(targetCounts.clients * progress),
            });
            if (frame === frames) clearInterval(timer);
        }, step);

        return () => clearInterval(timer);
    }, []);

    return (
        <section className="py-20 md:py-32 bg-gray-50 overflow-hidden" id="solutions">
            <div className="container mx-auto px-4 max-w-7xl">
                
                {/* Section Header with Carousel Controls */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-16">
                    <div className="max-w-3xl">
                        <span className="inline-block px-4 py-1.5 bg-[#8E2A8B]/10 text-[#8E2A8B] text-xs font-bold rounded-full uppercase tracking-widest mb-4">
                            Business & Corporate Solutions
                        </span>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#2D1B4E] leading-tight mb-4 font-outfit">
                            Solutions for Every <br className="hidden md:block" />
                            <span className="text-[#8E2A8B]">Business Gifting Need</span>
                        </h2>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => scroll('left')} className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#8E2A8B] hover:text-[#8E2A8B] transition-colors">
                            <ChevronLeft size={24} />
                        </button>
                        <button onClick={() => scroll('right')} className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#8E2A8B] hover:text-[#8E2A8B] transition-colors">
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>

                {/* Scenario Cards Carousel */}
                <div 
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto gap-6 pb-12 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0"
                >
                    {scenarios.map((scenario, idx) => (
                        <div 
                            key={idx} 
                            className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl border border-gray-100 transition-all duration-300 group flex flex-col flex-shrink-0 w-[280px] md:w-[320px] snap-start"
                            onMouseEnter={() => handleCardClick(scenario.title)}
                        >
                            {/* Card Image Header */}
                            <div className="h-40 w-full relative overflow-hidden">
                                <img src={scenario.image} alt={scenario.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                            </div>
                            
                            {/* Card Content */}
                            <div className="p-6 pt-10 flex flex-col flex-grow">
                                <h3 className="text-lg font-bold text-[#2D1B4E] mb-3 font-outfit">{scenario.title}</h3>
                                
                                <div className="mb-6 flex-grow">
                                    <p className="text-gray-400 text-xs font-medium italic mb-3">
                                        "{scenario.problem}"
                                    </p>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        {scenario.solution}
                                    </p>
                                </div>

                                <button 
                                    onClick={() => handleCtaClick(scenario.cta, scenario.eventName)}
                                    className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-[#8E2A8B] text-gray-700 hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors mt-auto group/btn"
                                >
                                    {scenario.cta}
                                    <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Impact Banner */}
                <div className="bg-[#2D1B4E] rounded-[2rem] overflow-hidden relative shadow-2xl mb-24 mt-12">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#8E2A8B] opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500 opacity-20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                    
                    <div className="relative z-10 px-8 py-16 md:p-20 flex flex-col lg:flex-row items-center justify-between gap-12">
                        <div className="lg:w-1/2 text-center lg:text-left">
                            <h3 className="text-4xl md:text-5xl font-black text-white mb-6 font-outfit">
                                Every Order Creates <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-purple-400">Opportunity</span>
                            </h3>
                            <p className="text-white/80 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                                When you partner with Kottravai, you're not just purchasing products. You're helping create sustainable livelihoods for rural women entrepreneurs and artisan communities.
                            </p>
                        </div>
                        
                        <div className="lg:w-1/2 grid grid-cols-2 gap-8 w-full">
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-black text-white mb-2">{counts.women}+</div>
                                <div className="text-pink-300 text-xs font-bold uppercase tracking-widest">Women Empowered</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-black text-white mb-2">{counts.artisans}+</div>
                                <div className="text-pink-300 text-xs font-bold uppercase tracking-widest">Artisan Partners</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-black text-white mb-2">{counts.products.toLocaleString()}+</div>
                                <div className="text-pink-300 text-xs font-bold uppercase tracking-widest">Products Delivered</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-black text-white mb-2">{counts.clients}+</div>
                                <div className="text-pink-300 text-xs font-bold uppercase tracking-widest">Business Clients</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Final CTA Section */}
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-black text-[#2D1B4E] mb-8 font-outfit">
                        Let's Build Meaningful Gifting Experiences Together
                    </h2>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button 
                            onClick={() => handleCtaClick('Request B2B Proposal', 'b2b_solution_cta_click')}
                            className="w-full sm:w-auto px-8 h-14 bg-[#8E2A8B] hover:bg-[#6D1E6A] text-white rounded-xl font-bold uppercase tracking-widest text-sm transition-colors flex items-center justify-center"
                        >
                            Request B2B Proposal
                        </button>
                        <button 
                            onClick={() => handleCtaClick('Schedule a Consultation', 'b2b_solution_cta_click')}
                            className="w-full sm:w-auto px-8 h-14 bg-white border-2 border-[#8E2A8B] text-[#8E2A8B] hover:bg-gray-50 rounded-xl font-bold uppercase tracking-widest text-sm transition-colors flex items-center justify-center"
                        >
                            Schedule a Consultation
                        </button>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default B2BSolutions;
