/**
 * NewsletterSignup — Phase 1: Lead Capture System
 * Embeddable email-only capture widget.
 * Usage: <NewsletterSignup />
 */
import { useState, FormEvent } from 'react';
import { captureLead } from '@/services/leadService';
import { Mail, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

interface NewsletterSignupProps {
    /** Visual variant — inline bar or stacked card */
    variant?: 'inline' | 'card';
    className?: string;
    placeholder?: string;
    ctaText?: string;
}

const NewsletterSignup = ({
    variant = 'inline',
    className = '',
    placeholder = 'Enter your email address',
    ctaText = 'Subscribe',
}: NewsletterSignupProps) => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        setStatus('loading');

        try {
            await captureLead({
                name: name.trim() || email.split('@')[0],
                email: email.trim(),
                source: 'newsletter',
                lead_type: 'general',
            });
            setStatus('success');
            setEmail('');
            setName('');
        } catch {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    if (status === 'success') {
        return (
            <div className={`flex items-center gap-3 text-emerald-600 font-semibold ${className}`}>
                <CheckCircle2 size={20} />
                <span className="text-sm">You're subscribed! Welcome to the Kottravai community.</span>
            </div>
        );
    }

    if (variant === 'card') {
        return (
            <div className={`bg-white rounded-2xl p-6 shadow-md border border-gray-100 ${className}`}>
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-[#8E2A8B]/10 rounded-full flex items-center justify-center">
                        <Mail size={14} className="text-[#8E2A8B]" />
                    </div>
                    <h3 className="font-black text-[#2D1B4E] text-sm uppercase tracking-wider">Newsletter</h3>
                </div>
                <p className="text-gray-500 text-xs mb-4">Get craft stories, offers & new arrivals straight to your inbox.</p>
                <form onSubmit={handleSubmit} className="space-y-2">
                    <input
                        type="text"
                        placeholder="Your name (optional)"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm bg-gray-50 rounded-xl border border-transparent focus:border-[#8E2A8B]/30 focus:outline-none transition"
                    />
                    <input
                        type="email"
                        required
                        placeholder={placeholder}
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm bg-gray-50 rounded-xl border border-transparent focus:border-[#8E2A8B]/30 focus:outline-none transition"
                    />
                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full bg-[#8E2A8B] hover:bg-[#72216F] text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition disabled:opacity-60"
                    >
                        {status === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                        {ctaText}
                    </button>
                </form>
                {status === 'error' && (
                    <p className="text-xs text-red-500 mt-2 text-center">Something went wrong. Please try again.</p>
                )}
            </div>
        );
    }

    // Default: inline bar
    return (
        <form onSubmit={handleSubmit} className={`flex items-center gap-2 ${className}`}>
            <div className="relative flex-1">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="email"
                    required
                    placeholder={placeholder}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 text-sm bg-gray-50 rounded-xl border border-transparent focus:border-[#8E2A8B]/30 focus:bg-white focus:outline-none transition"
                />
            </div>
            <button
                type="submit"
                disabled={status === 'loading'}
                className="bg-[#8E2A8B] hover:bg-[#72216F] text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition whitespace-nowrap disabled:opacity-60"
            >
                {status === 'loading' ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
                {ctaText}
            </button>
        </form>
    );
};

export default NewsletterSignup;
