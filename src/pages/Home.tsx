import { lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import MainLayout from '@/layouts/MainLayout';

// ─── ABOVE FOLD: load eagerly (LCP-critical, first paint) ────────────────────
import HeroSlider from '@/components/home/HeroSlider';
import CategoryRow from '@/components/home/CategoryRow';
import BestSellers from '@/components/home/BestSellers';

// ─── BELOW FOLD: lazy load (never block first paint) ─────────────────────────
const NewArrivals = lazy(() => import('@/components/home/NewArrivals'));
const FeaturedMedia = lazy(() => import('@/components/home/FeaturedMedia'));
const FeatureCards = lazy(() => import('@/components/home/FeatureCards'));
const HampersRow = lazy(() => import('@/components/home/HampersRow'));
const CuratedMoments = lazy(() => import('@/components/home/CuratedMoments'));
const TextTestimonials = lazy(() => import('@/components/home/TextTestimonials'));
const JournalSection = lazy(() => import('@/components/home/JournalSection'));
const SeeKottravaiInLife = lazy(() => import('@/components/home/SeeKottravaiInLife'));
const CocoCraftsRow = lazy(() => import('@/components/home/CocoCraftsRow'));
const BananaFiberRow = lazy(() => import('@/components/home/BananaFiberRow'));
const GiftBundleBuilder = lazy(() => import('@/components/home/GiftBundleBuilder'));
const HeritageMixes = lazy(() => import('@/components/home/HeritageMixes'));
const Testimonials = lazy(() => import('@/components/home/Testimonials'));

// Premium, lightweight skeleton/spinner fallback to ensure excellent layout stability
const SectionSkeleton = () => (
    <div className="w-full max-w-[1240px] mx-auto py-10 px-4 md:px-8 animate-pulse">
        <div className="h-6 bg-gray-100 rounded-md w-48 mb-6"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="h-48 bg-gray-50/50 rounded-2xl"></div>
            <div className="h-48 bg-gray-50/50 rounded-2xl"></div>
            <div className="h-48 bg-gray-50/50 rounded-2xl"></div>
            <div className="h-48 bg-gray-50/50 rounded-2xl"></div>
        </div>
    </div>
);

const Home = () => {
    return (
        <MainLayout>
            <Helmet>
                <title>Kottravai | Handmade Crafts, Eco Products &amp; Traditional Food Mixes.</title>
                <meta name="description" content="Kottravai offers premium handcrafted terracotta jewellery, heritage mixes, and essential care products. Shop our exclusive collection today." />
            </Helmet>

            {/* 1. Hero — EAGER, LCP element lives here */}
            <HeroSlider />

            {/* 1.5. New Category Row */}
            <CategoryRow />

            {/* 2. Best Sellers — EAGER, visible above fold on desktop */}
            <BestSellers />

            <Suspense fallback={<SectionSkeleton />}>
                {/* Note: placing media feature immediately after Best Sellers */}
                <FeaturedMedia />
            </Suspense>

            <Suspense fallback={<SectionSkeleton />}>
                {/* Feature Promotional Cards */}
                <FeatureCards />
            </Suspense>

            {/* WhatsApp Banner — static HTML, no JS cost (placed above New Arrivals) */}
            <div className="w-full pt-8 pb-4 px-4 md:px-8">
                <div className="max-w-[1240px] mx-auto">
                    <a
                        href="https://whatsapp.com/channel/0029VbAxfDt6rsQwQdzLjS2m"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block hover:opacity-95 transition-opacity"
                    >
                        <img
                            src="/whatsapp-banner.webp"
                            alt="Join Kottravai WhatsApp Community"
                            width={1240}
                            height={300}
                            className="w-full h-auto object-cover shadow-sm animate-pulse-slow"
                            loading="lazy"
                            decoding="async"
                        />
                    </a>
                </div>
            </div>

            <Suspense fallback={<SectionSkeleton />}>
                {/* 2.1 New Arrivals */}
                <NewArrivals />
            </Suspense>

            <Suspense fallback={<SectionSkeleton />}>
                <HampersRow />
            </Suspense>

            <Suspense fallback={<SectionSkeleton />}>
                <CuratedMoments />
            </Suspense>

            <Suspense fallback={null}>
                <TextTestimonials />
            </Suspense>

            <Suspense fallback={null}>
                <JournalSection />
            </Suspense>

            <Suspense fallback={null}>
                <SeeKottravaiInLife />
            </Suspense>

            {/* Coco Crafts Section — Premium Redesign */}
            <Suspense fallback={<SectionSkeleton />}>
                <CocoCraftsRow />
            </Suspense>

            {/* Banana Fiber Section — New Design */}
            <Suspense fallback={<SectionSkeleton />}>
                <BananaFiberRow />
            </Suspense>

            <Suspense fallback={null}>
                <GiftBundleBuilder />
            </Suspense>

            <Suspense fallback={<SectionSkeleton />}>
                <HeritageMixes />
            </Suspense>

            <Suspense fallback={null}>
                <Testimonials />
            </Suspense>

        </MainLayout>
    );
};

export default Home;


