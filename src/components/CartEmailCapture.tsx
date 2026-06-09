/**
 * CartEmailCapture — Phase 1: Lead Capture System
 * Subtle email capture banner shown in the Cart page for guest users.
 * Place inside Cart.tsx when cart has items and user is not logged in.
 */
import { useState, FormEvent } from 'react';
import { captureLead } from '@/services/leadService';
import { Mail, X, ArrowRight, Loader2, CheckCircle2, Gift } from 'lucide-react';

interface CartEmailCaptureProps {
    onDismiss?: () => void;
}

const CartEmailCapture = ({ onDismiss }: CartEmailCaptureProps) => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'dismissed'>('idle');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        setStatus('loading');

        try {
            await captureLead({
                name: email.split('@')[0], // Best-effort name from email prefix
                email: email.trim(),
                source: 'cart_capture',
                lead_type: 'general',
                notes: 'Captured from cart page — guest user with items in cart',
            });
            setStatus('success');
        } catch {
            // Silent fail — never block cart experience
            setStatus('dismissed');
        }
    };

    const handleDismiss = () => {
        setStatus('dismissed');
        onDismiss?.();
    };

    if (status === 'dismissed') return null;

    if (status === 'success') {
        return (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={18} />
                <p className="text-sm text-emerald-700 font-semibold">
                    Saved! We'll email you if anything in your cart goes on sale.
                </p>
            </div>
        );
    }

    return (
        <div className="relative bg-gradient-to-r from-[#2D1B4E] to-[#8E2A8B] rounded-2xl p-5 text-white overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/5 rounded-full" />
            <div className="absolute -right-2 -bottom-3 w-12 h-12 bg-white/5 rounded-full" />

            {/* Dismiss button */}
            <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss"
                className="absolute top-3 right-3 text-white/50 hover:text-white transition"
            >
                <X size={14} />
            </button>

            <div className="flex items-center gap-2 mb-2">
                <Gift size={15} className="text-yellow-300" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Save Your Cart</span>
            </div>

            <h3 className="font-black text-sm mb-1">Don't lose your selection!</h3>
            <p className="text-white/70 text-xs mb-4">
                Enter your email and we'll save your cart &amp; notify you about offers.
            </p>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="relative flex-1">
                    <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full pl-8 pr-3 py-2.5 text-xs bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition"
                    />
                </div>
                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="bg-white text-[#8E2A8B] px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-yellow-50 transition disabled:opacity-60 whitespace-nowrap"
                >
                    {status === 'loading'
                        ? <Loader2 size={12} className="animate-spin" />
                        : <ArrowRight size={12} />}
                    Save
                </button>
            </form>
        </div>
    );
};

export default CartEmailCapture;
