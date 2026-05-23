import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, Briefcase, Link as LinkIcon, Send, Heart, ShieldCheck, ChevronRight } from 'lucide-react';

interface FriendsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FriendsModal: React.FC<FriendsModalProps> = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        profession: '',
        socialMedia: ''
    });

    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            setStatus('success');
            setTimeout(() => {
                onClose();
                setStatus('idle');
                setFormData({ name: '', email: '', phone: '', profession: '', socialMedia: '' });
            }, 2000);
        } catch (error) {
            setStatus('error');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#2D1B4E]/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden relative z-10 flex flex-col md:flex-row"
                    >
                        {/* Left Side: Branding */}
                        <div className="md:w-[38%] bg-[#F9F5FF] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden shrink-0">
                            {/* Decorative element */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#8E2A8B]/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                            
                            <div className="relative z-10">
                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#2D1B4E] leading-[1.1] mb-4 font-outfit">
                                    Become a <br />
                                    <span className="text-[#8E2A8B]">Friends of <br /> Kottravai</span>
                                </h2>
                                <div className="w-12 h-1 bg-[#8E2A8B] mb-6"></div>
                                <p className="text-gray-500 text-sm leading-relaxed font-medium mb-8">
                                    Join our community and be part of a movement that values sustainability, craftsmanship and meaningful connections.
                                </p>

                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-10 h-10 rounded-full bg-[#8E2A8B]/10 flex items-center justify-center text-[#8E2A8B]">
                                        <Heart size={18} fill="currentColor" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#2D1B4E] text-xs">Be a Friend.</p>
                                        <p className="text-gray-400 text-[10px] font-medium">Make an Impact.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Line Art Placeholder */}
                            <div className="mt-auto relative opacity-10 hidden md:block">
                                <svg viewBox="0 0 200 200" className="w-full h-auto max-w-[150px] mx-auto">
                                    <path d="M100 160 C140 160 170 130 170 90 C170 50 140 30 100 30 C60 30 30 50 30 90 C30 130 60 160 100 160 Z" fill="none" stroke="currentColor" strokeWidth="1"/>
                                    <path d="M70 100 Q100 130 130 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </div>

                            <button 
                                onClick={onClose}
                                className="absolute top-4 right-4 text-gray-400 hover:text-[#8E2A8B] transition-colors md:hidden"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Right Side: Form - Scrollable */}
                        <div className="md:w-[62%] p-6 md:p-10 lg:p-12 relative overflow-y-auto">
                            <button 
                                onClick={onClose}
                                className="absolute top-6 right-6 text-gray-400 hover:text-[#8E2A8B] transition-colors hidden md:block"
                            >
                                <X size={24} />
                            </button>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Name Field */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[#2D1B4E] uppercase tracking-wider">Name <span className="text-[#8E2A8B]">*</span></label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                            <User size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Enter your name"
                                            required
                                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:border-[#8E2A8B] focus:ring-4 focus:ring-[#8E2A8B]/5 transition-all text-sm font-medium"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>
                                </div>

                                {/* Email Field */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[#2D1B4E] uppercase tracking-wider">Email <span className="text-[#8E2A8B]">*</span></label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Mail size={16} />
                                        </div>
                                        <input
                                            type="email"
                                            placeholder="Enter your email address"
                                            required
                                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:border-[#8E2A8B] focus:ring-4 focus:ring-[#8E2A8B]/5 transition-all text-sm font-medium"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        />
                                    </div>
                                </div>

                                {/* Phone Field */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[#2D1B4E] uppercase tracking-wider">Phone <span className="text-[#8E2A8B]">*</span></label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Phone size={16} />
                                        </div>
                                        <input
                                            type="tel"
                                            placeholder="Enter your phone number"
                                            required
                                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:border-[#8E2A8B] focus:ring-4 focus:ring-[#8E2A8B]/5 transition-all text-sm font-medium"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        />
                                    </div>
                                </div>

                                {/* Profession Field */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[#2D1B4E] uppercase tracking-wider">Profession <span className="text-[#8E2A8B]">*</span></label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Briefcase size={16} />
                                        </div>
                                        <select
                                            required
                                            className="w-full pl-11 pr-10 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:border-[#8E2A8B] focus:ring-4 focus:ring-[#8E2A8B]/5 transition-all text-sm font-medium appearance-none cursor-pointer"
                                            value={formData.profession}
                                            onChange={(e) => setFormData({...formData, profession: e.target.value})}
                                        >
                                            <option value="" disabled>Select your profession</option>
                                            <option value="Influencers">Influencers</option>
                                            <option value="Corporate Employees">Corporate Employees</option>
                                            <option value="HR's">HR's</option>
                                            <option value="Founders">Founders</option>
                                            <option value="Investors">Investors</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                            <ChevronRight size={14} className="rotate-90" />
                                        </div>
                                    </div>
                                </div>

                                {/* Social Media Field */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[#2D1B4E] uppercase tracking-wider">Social Media Profile <span className="text-[#8E2A8B]">*</span></label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                            <LinkIcon size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Enter your social media link"
                                            required
                                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:border-[#8E2A8B] focus:ring-4 focus:ring-[#8E2A8B]/5 transition-all text-sm font-medium"
                                            value={formData.socialMedia}
                                            onChange={(e) => setFormData({...formData, socialMedia: e.target.value})}
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={status === 'submitting'}
                                    className="w-full bg-[#8E2A8B] hover:bg-[#6d1e6a] text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-[#8E2A8B]/20 mt-2"
                                >
                                    {status === 'submitting' ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>Submit <Send size={18} /></>
                                    )}
                                </button>

                                {/* Privacy Footer */}
                                <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-medium pt-1">
                                    <ShieldCheck size={12} className="text-[#8E2A8B]/60" />
                                    <span>We respect your privacy. Data is kept secure.</span>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default FriendsModal;
