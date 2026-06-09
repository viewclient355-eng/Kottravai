/**
 * Lead Service — Phase 1: Lead Capture & Qualification System
 * Handles AI classification, Supabase persistence, email ACK, and analytics.
 */

import { supabase } from '@/utils/supabaseClient';
import analytics from '@/utils/analyticsService';
import { API_ENDPOINTS } from '@/config/api';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type LeadType = 'corporate_gifting' | 'wedding' | 'retail' | 'general';
export type LeadSource = 'contact_form' | 'b2b_inquiry' | 'newsletter' | 'cart_capture';
export type LeadStatus = 'new' | 'qualified' | 'converted' | 'disqualified';
export type LeadPriority = 'low' | 'medium' | 'high';

export interface LeadData {
    name: string;
    email: string;
    phone?: string;
    company_name?: string;
    source: LeadSource;
    notes?: string;
    // Caller can override auto-classification
    lead_type?: LeadType;
    priority?: LeadPriority;
    // Optional fields for updates or pre-filled values
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    last_contacted_at?: string;
    next_followup_at?: string;
}

export interface SavedLead extends LeadData {
    id: string;
    created_at: string;
    status: LeadStatus;
    lead_score: number;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    last_contacted_at?: string;
    next_followup_at?: string;
}

// ─────────────────────────────────────────────
// AI Keyword Classifier
// ─────────────────────────────────────────────
const KEYWORDS: Record<LeadType, string[]> = {
    corporate_gifting: [
        'employee gifts', 'employee gift', 'corporate gifts', 'corporate gift',
        'bulk order', 'bulk orders', 'festival gifts', 'festival gift',
        'office gift', 'company gift', 'diwali gift', 'corporate hamper',
        'client gift', 'team gift', 'brand gift', 'promotional gift'
    ],
    wedding: [
        'wedding', 'return gifts', 'return gift', 'guests', 'bride',
        'groom', 'marriage', 'engagement', 'reception', 'shaadi',
        'wedding hamper', 'bridal', 'mehendi'
    ],
    retail: [
        'wholesale', 'reseller', 'retail partner', 'distributor',
        'stockist', 'dealer', 'franchise', 'bulk purchase', 'b2b',
        'shop', 'store', 'resell', 'supply'
    ],
    general: []
};

/**
 * Classifies a lead based on keyword matching across all text fields.
 * Returns the best-matched LeadType and a numeric score (0–100).
 */
export const classifyLead = (text: string): { lead_type: LeadType; lead_score: number } => {
    const normalized = text.toLowerCase();
    const scores: Record<LeadType, number> = {
        corporate_gifting: 0,
        wedding: 0,
        retail: 0,
        general: 5 // default minimum
    };

    for (const [type, keywords] of Object.entries(KEYWORDS) as [LeadType, string[]][]) {
        for (const kw of keywords) {
            if (normalized.includes(kw)) {
                scores[type] += 20;
            }
        }
    }

    const best = (Object.entries(scores) as [LeadType, number][])
        .sort(([, a], [, b]) => b - a)[0];

    const lead_type: LeadType = best[1] > 5 ? best[0] : 'general';
    const lead_score = Math.min(best[1], 100);

    return { lead_type, lead_score };
};

/**
 * Derives priority from lead_type and lead_score.
 * Corporate gifting / retail with high score → high priority.
 */
const derivePriority = (lead_type: LeadType, lead_score: number): LeadPriority => {
    if (lead_type === 'corporate_gifting' || lead_type === 'retail') {
        return lead_score >= 40 ? 'high' : 'medium';
    }
    if (lead_type === 'wedding') return 'medium';
    return 'low';
};

// ─────────────────────────────────────────────
// UTM Capture
// ─────────────────────────────────────────────
const getUTM = () => {
    const params = new URLSearchParams(window.location.search);
    return {
        utm_source: params.get('utm_source') || localStorage.getItem('kottravai_utm_source') || undefined,
        utm_medium: params.get('utm_medium') || localStorage.getItem('kottravai_utm_medium') || undefined,
        utm_campaign: params.get('utm_campaign') || localStorage.getItem('kottravai_utm_campaign') || undefined,
    };
};

// ─────────────────────────────────────────────
// Supabase Persist
// ─────────────────────────────────────────────
/**
 * Saves a lead to Supabase, auto-classifying and scoring if not overridden.
 * Returns the inserted row or throws.
 */
export const saveLead = async (data: LeadData): Promise<SavedLead | null> => {
    try {
        // Build combined text for classification
        const textForClassification = [
            data.notes || '',
            data.company_name || '',
            data.name || ''
        ].join(' ');

        const { lead_type: autoType, lead_score } = classifyLead(textForClassification);
        const lead_type = data.lead_type || autoType;
        const priority = data.priority || derivePriority(lead_type, lead_score);
        const utm = getUTM();

        const payload = {
            name: data.name.trim(),
            email: data.email.trim().toLowerCase(),
            phone: data.phone?.trim() || null,
            company_name: data.company_name?.trim() || null,
            lead_type,
            source: data.source,
            status: 'new' as LeadStatus,
            notes: data.notes?.trim() || null,
            priority,
            lead_score,
            utm_source: utm.utm_source || null,
            utm_medium: utm.utm_medium || null,
            utm_campaign: utm.utm_campaign || null,
        };

        const { data: inserted, error } = await supabase
            .from('leads')
            .insert([payload])
            .select()
            .single();

        if (error) {
            console.error('[LeadService] Supabase insert error:', error.message);
            return null;
        }

        console.log('[LeadService] Lead saved:', inserted?.id, '| type:', lead_type, '| score:', lead_score);
        return inserted as SavedLead;
    } catch (err) {
        console.error('[LeadService] Unexpected error saving lead:', err);
        return null;
    }
};

// ─────────────────────────────────────────────
// Email Acknowledgement (via Zoho SMTP backend)
// ─────────────────────────────────────────────
const ACK_MESSAGES: Record<LeadSource, string> = {
    contact_form: 'Thank you for contacting Kottravai! We have received your message and will get back to you within 24 hours.',
    b2b_inquiry: 'Thank you for your B2B inquiry! Our partnerships team will review your request and reach out within 24 hours to discuss how we can work together.',
    newsletter: 'Welcome to the Kottravai community! You have been successfully subscribed to our newsletter.',
    cart_capture: 'Thank you for your interest in Kottravai! We will keep you updated on your saved items and exclusive offers.',
};

export const sendAcknowledgementEmail = async (
    name: string,
    email: string,
    source: LeadSource
): Promise<void> => {
    try {
        const message = ACK_MESSAGES[source];
        await fetch(API_ENDPOINTS.contact, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                email,
                subject: `Thanks for reaching out to Kottravai`,
                message,
                _ack_only: true, // Signal to backend this is an ACK, not an admin alert
            }),
        });
        console.log('[LeadService] ACK email dispatched for:', email);
    } catch (err) {
        console.warn('[LeadService] ACK email failed (non-critical):', err);
    }
};

// ─────────────────────────────────────────────
// Analytics Tracking
// ─────────────────────────────────────────────
export const trackLeadEvent = (
    eventType: 'lead_created' | 'lead_qualified' | 'b2b_inquiry' | 'newsletter_signup' | 'cart_email_capture',
    metadata: Record<string, any> = {}
): void => {
    analytics.trackEvent(eventType, metadata);
};

// ─────────────────────────────────────────────
// Combined "Capture Lead" Helper
// Saves + sends ACK + tracks — call this from all forms
// ─────────────────────────────────────────────
export const captureLead = async (data: LeadData): Promise<void> => {
    const [saved] = await Promise.allSettled([
        saveLead(data),
    ]);

    const leadId = saved.status === 'fulfilled' ? saved.value?.id : undefined;

    // Fire ACK email (non-blocking)
    sendAcknowledgementEmail(data.name, data.email, data.source).catch(() => {});

    // Track analytics
    const eventMap: Record<LeadSource, Parameters<typeof trackLeadEvent>[0]> = {
        contact_form: 'lead_created',
        b2b_inquiry: 'b2b_inquiry',
        newsletter: 'newsletter_signup',
        cart_capture: 'cart_email_capture',
    };

    trackLeadEvent(eventMap[data.source], {
        source: data.source,
        lead_id: leadId,
        has_phone: !!data.phone,
        has_company: !!data.company_name,
    });

    // Always fire lead_created for all sources
    if (data.source !== 'contact_form') {
        trackLeadEvent('lead_created', { source: data.source, lead_id: leadId });
    }
};
