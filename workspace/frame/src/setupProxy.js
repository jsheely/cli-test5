const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/client',
    createProxyMiddleware({
      target: 'http://localhost:5001',
      changeOrigin: true,
      // pathRewrite: {'^/client' : ''}

    })
  );
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5002',
      changeOrigin: true,
    })
  );
};