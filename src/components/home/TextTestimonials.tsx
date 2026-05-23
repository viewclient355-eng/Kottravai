import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const testimonials = [
    {
        id: 1,
        name: 'Anitha R.',
        address: 'Chennai',
        content: 'The coconut shell bowls are so beautiful and sturdy. Love using them every day!',
        avatar: '/uploads/2026/01/journal-launch.jpg',
        rating: 5
    },
    {
        id: 2,
        name: 'Karthik S.',
        address: 'Coimbatore',
        content: "Idly podi is just like my mom's homemade recipe. Absolutely love it!",
        avatar: '/uploads/2026/01/journal-stall.jpg',
        rating: 4.5
    },
    {
        id: 3,
        name: 'Priya M.',
        address: 'Bangalore',
        content: 'The hamper was beautifully packed and made for a perfect gift. Thank you Kottravai!',
        avatar: '/hampers.webp',
        rating: 4
    },
    {
        id: 4,
        name: 'Meenakshi T.',
        address: 'Madurai',
        content: 'Amazing quality and natural ingredients. My go-to store for healthy choices.',
        avatar: '/uploads/2026/01/journal-featured.jpg',
        rating: 4.5
    }
];

const TestimonialCard = ({ t }: { t: any }) => {
        return (
        <div className="relative flex-shrink-0 w-[85vw] max-w-[340px] sm:w-[300px] md:w-[340px]">
            <div className="relative bg-white rounded-3xl p-6 pt-4 shadow-[0_20px_40px_rgba(2,6,23,0.05)] border border-transparent min-h-[320px] flex flex-col justify-between">
                <div className="flex items-center gap-1 mb-2">
                                {(() => {
                                    const stars = [] as JSX.Element[];
                                    const rating = t.rating ?? 5;
                                    const full = Math.floor(rating);
                                    const hasHalf = rating % 1 === 0.5;
                                    for (let si = 1; si <= 5; si++) {
                                        const key = `star-${t.id}-${si}`;
                                        if (si <= full) {
                                            stars.push(
                                                <svg key={key} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 text-[#F59E0B] fill-current">
                                                    <path d="M12 .587l3.668 7.431L24 9.748l-6 5.847L19.335 24 12 20.201 4.665 24 6 15.595 0 9.748l8.332-1.73z" />
                                                </svg>
                                            );
                                        } else if (si === full + 1 && hasHalf) {
                                            const clipId = `half-clip-${t.id}-${si}`;
                                            stars.push(
                                                <div key={key} className="relative w-4 h-4">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 text-gray-300 fill-current">
                                                        <path d="M12 .587l3.668 7.431L24 9.748l-6 5.847L19.335 24 12 20.201 4.665 24 6 15.595 0 9.748l8.332-1.73z" />
                                                    </svg>
                                                    <svg className="absolute left-0 top-0 w-4 h-4 text-[#F59E0B] fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                                        <defs>
                                                            <clipPath id={clipId}>
                                                                <rect x="0" y="0" width="12" height="24" />
                                                            </clipPath>
                                                        </defs>
                                                        <g clipPath={`url(#${clipId})`}>
                                                            <path d="M12 .587l3.668 7.431L24 9.748l-6 5.847L19.335 24 12 20.201 4.665 24 6 15.595 0 9.748l8.332-1.73z" />
                                                        </g>
                                                    </svg>
                                                </div>
                                            );
                                        } else {
                                            stars.push(
                                                <svg key={key} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 text-gray-300 fill-current">
                                                    <path d="M12 .587l3.668 7.431L24 9.748l-6 5.847L19.335 24 12 20.201 4.665 24 6 15.595 0 9.748l8.332-1.73z" />
                                                </svg>
                                            );
                                        }
                                    }
                                    return stars;
                                })()}
                        </div>

                        <p className="text-gray-600 italic text-center mb-6">“{t.content}”</p>

                <div className="flex justify-center -mt-6">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center border-2 border-dashed border-[#8E2A8B]/20 overflow-hidden">
                            <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>

                <div className="text-center mt-4">
                    <div className="text-lg font-bold text-[#1A1A1A]">{t.name}</div>
                    <div className="text-sm text-[#8E2A8B] mt-1">{t.address}</div>
                </div>
            </div>
        </div>
    );
};

const TextTestimonials = () => {
    const carouselRef = useRef<HTMLDivElement>(null);

    const scrollCarousel = (direction: 'left' | 'right') => {
        if (carouselRef.current) {
            const { scrollLeft, clientWidth } = carouselRef.current;
            const scrollAmount = clientWidth * 0.7;
            const scrollTo = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
            carouselRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    return (
        <section className="py-6 bg-white">
            <div className="container mx-auto px-4 max-w-[1240px]">
                <div className="mb-12 text-left">
                    <h2 className="text-3xl md:text-4xl font-black text-[#1A1A1A]">What Our Customer Says</h2>
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
                        {testimonials.map((t) => (
                            <div key={t.id} className="snap-center">
                                <TestimonialCard t={t} />
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

export default TextTestimonials;
