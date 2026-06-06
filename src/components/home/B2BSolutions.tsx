import React, { useEffect, useState } from 'react';
import { HeartHandshake, PackageOpen, Sparkles, Briefcase, Heart, CalendarCheck, Globe, Store, ChevronRight } from 'lucide-react';
import analytics from '@/utils/analyticsService';

const B2BSolutions = () => {
    // Analytics tracking functions
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

    const scenarios = [
        {
            title: "Employee Appreciation Gifts",
            problem: "We want to recognize employees, but generic gifts feel impersonal.",
            solution: "Curated employee appreciation gift hampers featuring handmade and sustainable products crafted by rural women entrepreneurs.",
            cta: "Explore Employee Gift Combos",
            icon: HeartHandshake,
            bgColor: "bg-pink-50",
            iconColor: "text-pink-600",
            eventName: "corporate_gifting_inquiry"
        },
        {
            title: "Employee Welcome Kits",
            problem: "New employees receive standard onboarding kits that don't create excitement.",
            solution: "Custom welcome kits with sustainable products, artisan-made items, and branded packaging.",
            cta: "Build Welcome Kits",
            icon: PackageOpen,
            bgColor: "bg-blue-50",
            iconColor: "text-blue-600",
            eventName: "corporate_gifting_inquiry"
        },
        {
            title: "Corporate Festival Gifting",
            problem: "Every festive season we struggle to find premium gifts for employees and clients.",
            solution: "Diwali, Pongal, New Year, and seasonal gift hampers available in bulk quantities.",
            cta: "View Festive Collections",
            icon: Sparkles,
            bgColor: "bg-amber-50",
            iconColor: "text-amber-600",
            eventName: "corporate_gifting_inquiry"
        },
        {
            title: "Client Appreciation Gifts",
            problem: "We want to strengthen client relationships through meaningful gifts.",
            solution: "Premium artisan gift boxes designed for client retention and relationship building.",
            cta: "Request Gift Catalogue",
            icon: Briefcase,
            bgColor: "bg-indigo-50",
            iconColor: "text-indigo-600",
            eventName: "corporate_gifting_inquiry"
        },
        {
            title: "Wedding Return Gifts",
            problem: "We need memorable return gifts that guests will actually value.",
            solution: "Elegant handmade gift collections with customizable packaging for weddings and family celebrations.",
            cta: "Explore Wedding Gift Combos",
            icon: Heart,
            bgColor: "bg-rose-50",
            iconColor: "text-rose-600",
            eventName: "wedding_gift_inquiry"
        },
        {
            title: "Event & Conference Giveaways",
            problem: "Most event giveaways are forgotten or discarded.",
            solution: "Useful, sustainable, and memorable artisan products for conferences, expos, and corporate events.",
            cta: "View Event Gift Solutions",
            icon: CalendarCheck,
            bgColor: "bg-emerald-50",
            iconColor: "text-emerald-600",
            eventName: "corporate_gifting_inquiry"
        },
        {
            title: "CSR & Social Impact Procurement",
            problem: "We want our procurement budget to create measurable social impact.",
            solution: "Every Kottravai order supports rural women entrepreneurs, artisan livelihoods, and skill development initiatives.",
            cta: "Partner With Kottravai",
            icon: Globe,
            bgColor: "bg-teal-50",
            iconColor: "text-teal-600",
            eventName: "csr_partnership_inquiry"
        },
        {
            title: "Retail & Bulk Partnerships",
            problem: "We need unique products that help our business stand out.",
            solution: "Wholesale pricing, retail partnerships, custom product sourcing, and artisan collections.",
            cta: "Become a Retail Partner",
            icon: Store,
            bgColor: "bg-purple-50",
            iconColor: "text-purple-600",
            eventName: "retail_partner_inquiry"
        }
    ];

    // Animated Statistics
    const [counts, setCounts] = useState({
        women: 0,
        artisans: 0,
        products: 0,
        clients: 0
    });

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
                
                {/* Section Header */}
                <div className="text-center max-w-4xl mx-auto mb-20">
                    <span className="inline-block px-4 py-1.5 bg-[#8E2A8B]/10 text-[#8E2A8B] text-xs font-bold rounded-full uppercase tracking-widest mb-6">
                        Business & Corporate Solutions
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#2D1B4E] leading-tight mb-8 font-outfit">
                        Solutions for Every <br className="hidden md:block" />
                        <span className="text-[#8E2A8B]">Business Gifting Need</span>
                    </h2>
                    <p className="text-gray-600 text-lg md:text-xl leading-relaxed">
                        Whether you're rewarding employees, celebrating milestones, or creating social impact through procurement, Kottravai offers meaningful gifting solutions that create lasting impressions.
                    </p>
                </div>

                {/* Scenario Cards Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
                    {scenarios.map((scenario, idx) => (
                        <div 
                            key={idx} 
                            className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group flex flex-col h-full"
                            onMouseEnter={() => handleCardClick(scenario.title)}
                        >
                            <div className={`w-14 h-14 rounded-2xl ${scenario.bgColor} ${scenario.iconColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                <scenario.icon size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-[#2D1B4E] mb-4 font-outfit">{scenario.title}</h3>
                            
                            <div className="mb-6 flex-grow">
                                <p className="text-gray-400 text-sm font-medium italic mb-4">
                                    "{scenario.problem}"
                                </p>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    <span className="font-bold text-gray-800">Solution:</span> {scenario.solution}
                                </p>
                            </div>

                            <button 
                                onClick={() => handleCtaClick(scenario.cta, scenario.eventName)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-[#8E2A8B] text-gray-700 hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors mt-auto"
                            >
                                {scenario.cta}
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Impact Banner */}
                <div className="bg-[#2D1B4E] rounded-[2rem] overflow-hidden relative shadow-2xl mb-24">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#8E2A8B] opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500 opacity-20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                    
                    <div className="relative z-10 px-8 py-16 md:p-20 flex flex-col lg:flex-row items-center justify-between gap-12">
                        <div className="lg:w-1/2 text-center lg:text-left">
                            <h3 className="text-4xl md:text-5xl font-black text-white mb-6 font-outfit">
                                Every Order Creates <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-purple-400">Opportunity</span>
                            </h3>
                            <p className="text-white/80 text-lg leading-relaxed max-w-xl">
                                When you partner with Kottravai, you're not just purchasing products. You're helping create sustainable livelihoods for rural women entrepreneurs and artisan communities.
                            </p>
                        </div>
                        
                        <div className="lg:w-1/2 grid grid-cols-2 gap-8 w-full">
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-black text-white mb-2">{counts.women}+</div>
                                <div className="text-pink-300 text-sm font-bold uppercase tracking-widest">Women Empowered</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-black text-white mb-2">{counts.artisans}+</div>
                                <div className="text-pink-300 text-sm font-bold uppercase tracking-widest">Artisan Partners</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-black text-white mb-2">{counts.products.toLocaleString()}+</div>
                                <div className="text-pink-300 text-sm font-bold uppercase tracking-widest">Products Delivered</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl md:text-5xl font-black text-white mb-2">{counts.clients}+</div>
                                <div className="text-pink-300 text-sm font-bold uppercase tracking-widest">Business Clients</div>
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
