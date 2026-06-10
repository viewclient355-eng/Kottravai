import React, { useState, useEffect } from 'react';
import { X, Mail, Gift, ArrowRight } from 'lucide-react';
import axios from 'axios';
import analytics from '@/utils/analyticsService';
import { API_ENDPOINTS } from '@/config/api';

interface CartEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CartEmailModal: React.FC<CartEmailModalProps> = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            analytics.trackEvent('cart_email_modal_shown');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedEmail = email.trim();
        
        if (!trimmedEmail) {
            setError('Please enter your email address');
            return;
        }

        if (!validateEmail(trimmedEmail)) {
            setError('Please enter a valid email address');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await axios.post(API_ENDPOINTS.leadCapture, {
                email: trimmedEmail,
                source: 'cart_capture',
                inquiry: 'Customer opted to save cart email for later follow up.'
            });

            // Save locally after backend capture succeeds
            localStorage.setItem('cart_email', trimmedEmail);
            analytics.trackEvent('cart_email_captured', {
                email: trimmedEmail
            });

            onClose();
        } catch (err) {
            console.error('Failed to save cart email', err);
            setError('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkip = () => {
        analytics.trackEvent('cart_email_skipped');
        // We set a flag so we don't bother them repeatedly in the same session
        sessionStorage.setItem("cart_email_skipped", "true");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={handleSkip}
            />

            {/* Modal Content */}
            <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <button 
                    onClick={handleSkip}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
                >
                    <X size={18} />
                </button>

                <div className="p-8 pb-6 text-center border-b border-gray-50">
                    <div className="w-16 h-16 bg-[#FDF2F8] rounded-full flex items-center justify-center mx-auto mb-5 border border-[#FBCFE8]">
                        <Mail className="text-[#EC4899]" size={28} />
                    </div>
                    
                    <h2 className="text-2xl font-black font-comfortaa text-[#2D1B4E] mb-3">
                        Save Your Cart for Later
                    </h2>
                    
                    <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-[280px] mx-auto">
                        Enter your email to save your cart and receive updates about your selected products.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 pt-6">
                    <div className="mb-6">
                        <div className="bg-[#FFF5F3] border border-[#FFE4DE] rounded-xl p-4 flex items-start gap-3 mb-6 shadow-sm">
                            <Gift className="text-[#F43F5E] shrink-0 mt-0.5" size={18} />
                            <p className="text-xs font-bold text-[#9F1239] leading-snug">
                                Submit your email to get more coupon codes to your mail
                            </p>
                        </div>

                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError('');
                                }}
                                placeholder="Enter your email address"
                                className={`w-full h-12 px-4 rounded-xl border ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} text-sm font-medium focus:outline-none focus:border-[#b5128f] focus:bg-white transition-colors`}
                            />
                            {error && (
                                <p className="absolute -bottom-5 left-1 text-[10px] font-bold text-red-500 uppercase tracking-widest">
                                    {error}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3 mt-8">
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-12 bg-black text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#b5128f] hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:transform-none"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Save Cart & Continue <ArrowRight size={16} /></>
                            )}
                        </button>

                        <button 
                            type="button"
                            onClick={handleSkip}
                            className="w-full h-12 bg-white text-gray-400 border border-gray-100 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Skip for Now
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CartEmailModal;
