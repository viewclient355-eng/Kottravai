import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { useReviews } from '@/context/ReviewContext';
import { useRef } from 'react';

const Testimonials = () => {
    const { getReviewsByPage } = useReviews();
    const testimonials = getReviewsByPage('home');
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
        <section className="py-4 md:py-6 bg-white">
            <div className="container px-4">
                <div className="text-center max-w-2xl mx-auto mb-8">
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 font-outfit">
                        Loved by Our Community
                    </h2>
                    <p className="text-gray-500">
                        What customers say about our craftsmanship and impact.
                    </p>
                </div>

                <div className="relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex">
                        <button
                            type="button"
                            onClick={() => scrollCarousel('left')}
                            className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-200 hover:bg-gray-50 transition"
                            aria-label="Scroll testimonials left"
                        >
                            <ChevronLeft size={18} />
                        </button>
                    </div>

                    <div
                        ref={carouselRef}
                        className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 scroll-smooth px-2"
                    >
                        {testimonials.map((testimonial) => (
                            <div
                                key={testimonial.id}
                                className="snap-center flex-shrink-0 w-[85vw] max-w-[360px] p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center"
                            >
                                <Quote className="w-8 h-8 text-purple-200 mb-6" fill="currentColor" />

                                <p className="text-gray-600 italic mb-8 leading-relaxed">
                                    "{testimonial.content}"
                                </p>

                                <div className="mt-auto flex items-center gap-4 text-left">
                                    <img
                                        src={testimonial.image}
                                        alt={testimonial.name}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div>
                                        <h3 className="font-bold text-gray-900">{testimonial.name}</h3>
                                        <p className="text-xs font-bold text-purple-700 tracking-wider uppercase">
                                            {testimonial.role}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex">
                        <button
                            type="button"
                            onClick={() => scrollCarousel('right')}
                            className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-200 hover:bg-gray-50 transition"
                            aria-label="Scroll testimonials right"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </section>
    );
};

export default Testimonials;
