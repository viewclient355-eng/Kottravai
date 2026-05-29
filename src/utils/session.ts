const SESSION_STORAGE_KEY = 'kottravai_session_id';
const SESSION_CREATED_AT_KEY = 'kottravai_session_created_at';

const generateUniqueId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `sid_${crypto.randomUUID()}`;
    }
    return `sid_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
};

export const getSessionId = (): string => {
    let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionId) {
        sessionId = generateUniqueId();
        sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
        sessionStorage.setItem(SESSION_CREATED_AT_KEY, new Date().toISOString());
    }
    return sessionId;
};

export const getSessionCreatedAt = (): string | null => {
    return sessionStorage.getItem(SESSION_CREATED_AT_KEY);
};
