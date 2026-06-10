import React, { useState } from 'react';
import axios from 'axios';
import { Mail, ArrowRight } from 'lucide-react';
import analytics from '@/utils/analyticsService';
import { API_ENDPOINTS } from '@/config/api';
import { BlogPost } from '@/types/blog';

interface Props {
    post: BlogPost;
}

const BlogEmailCapture: React.FC<Props> = ({ post }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim() || !email.trim()) return;
        
        setStatus('loading');

        try {
            // Track analytics
            analytics.trackEvent('blog_email_signup', {
                article_title: post.title,
                article_slug: post.slug,
                category: post.category,
                email: email.trim(),
                name: name.trim()
            });

            await axios.post(API_ENDPOINTS.leadCapture, {
                name: name.trim(),
                email: email.trim(),
                source: 'newsletter',
                inquiry: `Newsletter signup from blog post: ${post.title}`
            });
            
            setStatus('success');
            setName('');
            setEmail('');
        } catch (error) {
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className="bg-[#FFF5F3] border border-[#FFE4DE] rounded-2xl p-8 text-center my-12 shadow-sm">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-[#FFE4DE]">
                    <Mail className="text-[#9F1239]" size={28} />
                </div>
                <h3 className="text-2xl font-black text-[#2D1B4E] mb-2">You're on the list!</h3>
                <p className="text-gray-600">Thank you for subscribing. We'll be in touch soon with sustainable living tips and exclusive offers.</p>
            </div>
        );
    }

    return (
        <div className="bg-[#FFF5F3] border border-[#FFE4DE] rounded-2xl p-8 my-12 shadow-sm">
            <div className="max-w-2xl mx-auto text-center">
                <h3 className="text-2xl font-black text-[#2D1B4E] mb-3">Stay Updated with Sustainable Living Tips</h3>
                <p className="text-gray-600 mb-8">Get product updates, artisan stories, and exclusive offers delivered directly to your inbox.</p>
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg mx-auto">
                    <div className="flex flex-col md:flex-row gap-4">
                        <input 
                            type="text"
                            placeholder="First Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="flex-1 h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#b5128f] transition-colors"
                        />
                        <input 
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="flex-1 h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#b5128f] transition-colors"
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full h-12 bg-black text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#b5128f] transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {status === 'loading' ? 'Submitting...' : <>Subscribe <ArrowRight size={16} /></>}
                    </button>
                </form>
                {status === 'error' && (
                    <p className="text-red-500 text-sm mt-4 font-medium">Something went wrong. Please try again.</p>
                )}
            </div>
        </div>
    );
};

export default BlogEmailCapture;
