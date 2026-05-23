let app;
let loadError;

try {
    app = require('../server/index.js');
} catch (err) {
    loadError = err;
    console.error('💥 [VERCEL] Critical: server/index.js failed to load:', err.message, err.stack);
}

module.exports = (req, res) => {
    if (loadError || !app) {
        console.error('💥 [VERCEL] Serving error response due to load failure:', loadError?.message);
        return res.status(500).json({
            error: 'Server failed to initialize',
            message: loadError?.message || 'Unknown initialization error',
            stack: loadError?.stack || 'No stack available',
            hint: 'Check Vercel function logs for the full startup error.'
        });
    }
    return app(req, res);
};
