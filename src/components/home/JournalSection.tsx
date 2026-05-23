import { journalData } from '@/data/homeData';
import { Link } from 'react-router-dom';
import { useNews } from '@/context/NewsContext';
import { useRef } from 'react';
import { ArrowRight, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const JournalSection = () => {
    const { newsItems } = useNews();
    const carouselRef = useRef<HTMLDivElement>(null);

    const scrollCarousel = (direction: 'left' | 'right') => {
        if (carouselRef.current) {
            const { scrollLeft, clientWidth } = carouselRef.current;
            const scrollAmount = clientWidth * 0.75;
            const scrollTo = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
            carouselRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    return (
        <section className="py-6 bg-[#FBF5FF]">
            <div className="container px-4 mx-auto max-w-[1240px]">
                <div className="mb-12 max-w-3xl">
                    <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] leading-tight mb-4 font-outfit">
                        {journalData.mainHeading}
                    </h2>
                    <p className="text-[#6F558A] text-lg leading-relaxed">
                        {journalData.subHeading}
                    </p>
                </div>

                <div className="relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex">
                        <button
                            type="button"
                            onClick={() => scrollCarousel('left')}
                            className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-200 hover:bg-gray-50 transition"
                            aria-label="Scroll journal left"
                        >
                            <ChevronLeft size={18} />
                        </button>
                    </div>

                    <div
                        ref={carouselRef}
                        className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 scroll-smooth px-2"
                    >
                        {newsItems.map((post) => (
                            <Link
                                key={post.id}
                                to={post.link}
                                className="snap-center flex-shrink-0 w-[85vw] max-w-[320px] md:w-[340px] group block rounded-3xl bg-white overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300"
                            >
                                <div className="h-[260px] overflow-hidden">
                                    <img
                                        src={post.image}
                                        alt={post.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                </div>
                                <div className="p-6">
                                    <span className="text-[#7B3EA7] text-xs font-black uppercase tracking-[0.35em] mb-3 inline-block">
                                        {post.category}
                                    </span>
                                    <h3 className="mt-2 text-lg md:text-xl font-black text-[#1F1149] leading-tight mb-5">
                                        {post.title}
                                    </h3>
                                    <div className="flex items-center justify-between text-sm text-[#7B3EA7] font-semibold">
                                        <span className="inline-flex items-center gap-2">
                                            Read More
                                            <ArrowRight size={16} />
                                        </span>
                                        <span className="inline-flex items-center gap-2 text-gray-400 font-medium">
                                            <Clock size={14} />
                                            {post.date}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex">
                        <button
                            type="button"
                            onClick={() => scrollCarousel('right')}
                            className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-200 hover:bg-gray-50 transition"
                            aria-label="Scroll journal right"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default JournalSection;
