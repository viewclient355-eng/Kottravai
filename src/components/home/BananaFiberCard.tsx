import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Zap } from 'lucide-react';
import { Product } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const BananaFiberCard: React.FC<{ product: Product }> = ({ product }) => {
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const isFavorite = isInWishlist(product.id);
    const navigate = useNavigate();

    const handleBuyNow = (e: React.MouseEvent) => {
        e.preventDefault();
        addToCart(product, 1);
        navigate('/checkout');
    };

    return (
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 flex flex-col h-full group transition-all duration-300 hover:shadow-xl">
            {/* Image Area */}
            <div className="relative aspect-square rounded-xl overflow-hidden mb-4">
                <Link to={`/product/${product.slug}`} className="block w-full h-full">
                    <img 
                        src={product.image} 
                        alt={product.name}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                </Link>

                <button 
                    onClick={() => toggleWishlist(product)}
                    className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md text-gray-400 hover:text-red-500 transition-colors z-10"
                >
                    <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
                </button>
            </div>

            {/* Carousel Dots */}
            <div className="flex justify-center gap-1.5 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-[#8E2A8B]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
            </div>

            {/* Info Section */}
            <div className="flex flex-col gap-1.5 mb-4 px-1">
                <Link to={`/product/${product.slug}`}>
                    <h3 className="text-[15px] font-bold text-[#1A1A1A] leading-tight line-clamp-2 hover:text-[#8E2A8B] transition-colors">
                        {product.name}
                    </h3>
                </Link>
                


                <div className="mt-1">
                    <span className="text-2xl font-black text-[#8E2A8B]">₹{product.price}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 mt-auto">
                <button 
                    onClick={() => {
                        addToCart(product, 1);
                        toast.success(`${product.name} added to cart!`);
                    }}
                    className="w-full h-11 bg-[#8E2A8B] text-white rounded-lg flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-[#72216F] transition-all shadow-md"
                >
                    <ShoppingBag size={14} />
                    Add to Cart
                </button>
                <button 
                    onClick={handleBuyNow}
                    className="w-full h-11 border-2 border-[#8E2A8B] text-[#8E2A8B] rounded-lg flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-[#8E2A8B] hover:text-white transition-all"
                >
                    <Zap size={14} />
                    Buy Now
                </button>
            </div>
        </div>
    );
};

export default BananaFiberCard;
