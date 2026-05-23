import { ShieldCheck, RefreshCcw, Truck, Headphones } from 'lucide-react';

const features = [
    {
        icon: ShieldCheck,
        title: 'Secure Payments',
        subtitle: '100% Protected',
    },
    {
        icon: RefreshCcw,
        title: 'Easy Returns',
        subtitle: 'Hassle-free returns',
    },
    {
        icon: Truck,
        title: 'On-time Delivery',
        subtitle: 'Right at your doorstep',
    },
    {
        icon: Headphones,
        title: '24/7 Support',
        subtitle: 'We’re here to help',
    },
];

const SmallFeatureBanner = () => {
    return (
        <section className="py-6 bg-[#FBF8FD]">
            <div className="container mx-auto px-4 max-w-[1240px]">
                <div className="rounded-xl bg-white border border-[#EDE1F5] shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EDE1F5]">
                        {features.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <div key={feature.title} className="flex items-center gap-4 px-6 py-6 sm:py-8">
                                    <div className="w-14 h-14 rounded-xl bg-[#F4EBF8] border border-[#E3D2EE] flex items-center justify-center text-[#8E2A8B]">
                                        <Icon size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[#1A1A1A] font-semibold text-sm sm:text-base">{feature.title}</p>
                                        <p className="text-[#6B7280] text-xs sm:text-sm mt-1">{feature.subtitle}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SmallFeatureBanner;
