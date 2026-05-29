const VISITOR_STORAGE_KEY = 'kottravai_visitor_id';

const generateUniqueVisitorId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `v_${crypto.randomUUID()}`;
    }
    return `v_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
};

export const getVisitorId = (): string => {
    let visitorId = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (!visitorId) {
        visitorId = generateUniqueVisitorId();
        localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);
    }
    return visitorId;
};

export const isRepeatVisitor = (): boolean => {
    return localStorage.getItem(VISITOR_STORAGE_KEY) !== null;
};
