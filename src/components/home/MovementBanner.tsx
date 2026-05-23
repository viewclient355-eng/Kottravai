import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const MovementBanner = () => {
    return (
        <section className="py-4 md:py-6 bg-white px-4">
            <div className="mx-auto" style={{ maxWidth: '1451px' }}>
                <div 
                    className="flex flex-col md:flex-row bg-gradient-to-r from-[#591C5C] to-[#451047] rounded-3xl overflow-hidden shadow-xl"
                >
                    
                    {/* Text Content */}
                    <div className="flex-1 p-8 md:p-12 lg:p-16 xl:p-20 flex flex-col justify-center relative overflow-hidden">
                        {/* Decorative background floral pattern */}
                        <div className="absolute top-4 left-4 opacity-10">
                            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="white"/>
                            </svg>
                        </div>
                        <div className="absolute bottom-4 right-1/4 opacity-10">
                            <svg width="150" height="150" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="white"/>
                            </svg>
                        </div>

                        <div className="relative z-10 xl:ml-8">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight font-outfit">
                                A Movement Beyond<br className="hidden md:block" /> Handmade Products
                            </h2>
                            <p className="text-white/90 text-base md:text-lg lg:text-xl mb-10 max-w-lg leading-relaxed">
                                Kottravai is transforming beedi rolling women into creators of sustainable and meaningful craftsmanship.
                            </p>
                            <Link 
                                to="/about" 
                                className="inline-flex items-center gap-2 bg-white text-[#451047] px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-colors self-start text-lg"
                            >
                                Read Our Story
                                <ArrowRight size={24} />
                            </Link>
                        </div>
                    </div>

                    {/* Image Area */}
                    <div className="flex-1 relative h-full overflow-hidden">
                        <img 
                            src="/movement-banner.jpeg" 
                            alt="A movement beyond handmade products" 
                            className="absolute inset-0 w-full h-full object-cover object-center md:object-right transition-transform duration-700"
                            loading="lazy"
                            decoding="async"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MovementBanner;
