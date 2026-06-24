const PRODUCTION_API = 'https://pand-back.vercel.app';
const LOCAL_API = 'http://localhost:5000';

const strip = (url) => (url ? String(url).trim().replace(/\/api\/?$/, '').replace(/\/+$/, '') : '');

export function getApiBaseUrl() {
    const fromEnv = strip(process.env.NEXT_PUBLIC_API_URL);
    if (fromEnv) return fromEnv;

    if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') return LOCAL_API;
    }

    return PRODUCTION_API;
}

export function getApiUrl() {
    return `${getApiBaseUrl()}/api`;
}

export function getSocketUrl() {
    const fromEnv = strip(process.env.NEXT_PUBLIC_SOCKET_URL);
    if (fromEnv) return fromEnv;
    return getApiBaseUrl();
}

export const PRODUCTION_URLS = {
    api: PRODUCTION_API,
    admin: 'https://panda-panel-puce.vercel.app',
    webstore: 'https://pandaemart.com'
};

export const LOCAL_URLS = {
    api: LOCAL_API,
    admin: 'http://localhost:3001',
    webstore: 'http://localhost:3000'
};

export function isSocketEnabled() {
    if (process.env.NEXT_PUBLIC_ENABLE_SOCKET === 'false') return false;
    if (typeof window === 'undefined') return false;
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1';
}
