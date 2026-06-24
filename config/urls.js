const PRODUCTION = {
    backend: 'https://pand-back.vercel.app',
    admin: 'https://panda-panel-puce.vercel.app',
    webstore: 'https://pandaemart.com'
};

const LOCAL = {
    backend: 'http://localhost:5000',
    admin: 'http://localhost:3001',
    webstore: 'http://localhost:3000'
};

const strip = (url) => (url ? String(url).trim().replace(/\/+$/, '') : '');

const getBackendUrl = () =>
    strip(process.env.BACKEND_URL) || (process.env.NODE_ENV === 'production' ? PRODUCTION.backend : LOCAL.backend);

const getAdminUrl = () =>
    strip(process.env.ADMIN_APP_URL) ||
    strip(process.env.FRONTEND_URL) ||
    (process.env.NODE_ENV === 'production' ? PRODUCTION.admin : LOCAL.admin);

const getWebstoreUrl = () =>
    strip(process.env.WEBSTORE_URL) ||
    strip(process.env.CLIENT_URL) ||
    (process.env.NODE_ENV === 'production' ? PRODUCTION.webstore : LOCAL.webstore);

const getAllowedOrigins = () => {
    const origins = new Set([
        ...Object.values(PRODUCTION),
        ...Object.values(LOCAL),
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:5000',
        strip(process.env.CLIENT_URL),
        strip(process.env.FRONTEND_URL),
        strip(process.env.ADMIN_APP_URL),
        strip(process.env.WEBSTORE_URL),
        strip(process.env.BACKEND_URL)
    ].filter(Boolean));

    return [...origins];
};

module.exports = {
    PRODUCTION,
    LOCAL,
    getBackendUrl,
    getAdminUrl,
    getWebstoreUrl,
    getAllowedOrigins
};
