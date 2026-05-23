import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Product } from '@/data/products';
import { useWishlist } from '@/context/WishlistContext';

interface NewArrivalProductCardProps {
    product: Product;
    index?: number;
}

const NewArrivalProductCard: React.FC<NewArrivalProductCardProps> = ({ product }) => {
    const { toggleWishlist, isInWishlist } = useWishlist();
    
    const isFavorite = isInWishlist(product.id);

    const handleToggleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(product);
    };

    return (
        <div className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 flex flex-col h-full mx-1 w-full">
            
            {/* Top Wishlist Heart */}
            <button 
                onClick={handleToggleWishlist}
                className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-sm z-20 transition-all duration-300 ${isFavorite ? 'bg-white text-red-500' : 'bg-white text-gray-400 hover:text-red-500'}`}
            >
                <Heart size={14} className={isFavorite ? 'fill-red-500' : ''} />
            </button>

            {/* Image Section */}
            <div className="relative aspect-square w-full flex items-center justify-center overflow-hidden bg-gray-50 border-b border-gray-50">
                <Link to={`/product/${product.slug}`} className="block w-full h-full">
                    <img
                        src={product.image}
                        alt={product.name}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                    />
                </Link>
            </div>

            {/* Content Section */}
            <div className="p-4 flex flex-col flex-grow items-start text-left">
                <Link to={`/product/${product.slug}`} className="w-full mb-3">
                    <h3 className="font-outfit font-bold text-[#1A1A1A] text-[13px] sm:text-sm leading-snug hover:text-[#8E2A8B] transition-colors line-clamp-2 uppercase">
                        {product.name}
                    </h3>
                </Link>

                <div className="text-lg font-black text-[#8E2A8B] mt-auto font-outfit">₹{Number(product.price).toFixed(2)}</div>
            </div>
        </div>
    );
};

export default NewArrivalProductCard;
