function applySecurityHeaders(reply, customCsp) {
  const isProduction = process.env.NODE_ENV === 'production';
  const enforceHttps = isProduction || process.env.ENFORCE_HTTPS === 'true';

  // HSTS - Force HTTPS connections
  if (enforceHttps) {
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Content Security Policy - Your strongest defense
  const cspPolicy = customCsp || "default-src 'none'; frame-ancestors 'none'; base-uri 'none'";
  reply.header('Content-Security-Policy', cspPolicy);

  // Prevent MIME sniffing attacks
  reply.header('X-Content-Type-Options', 'nosniff');

  // Stop clickjacking
  reply.header('X-Frame-Options', 'DENY');

  // Control referrer leakage
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Disable dangerous browser features
  reply.header(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  );

  // Cross-origin isolation
  reply.header('Cross-Origin-Embedder-Policy', 'require-corp');
  reply.header('Cross-Origin-Opener-Policy', 'same-origin');
  reply.header('Cross-Origin-Resource-Policy', 'cross-origin');

  // Prevent caching of sensitive data
  reply.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  reply.header('Pragma', 'no-cache');
  reply.header('Expires', '0');

  // Keep search engines out
  reply.header('X-Robots-Tag', 'noindex, nofollow, nosnippet, noarchive');

  // Remove server fingerprinting
  reply.removeHeader('Server');
  reply.removeHeader('X-Powered-By');
}

function applyRelaxedSecurityHeaders(reply) {
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'DENY');
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  reply.header('Cache-Control', 'public, max-age=300');
  reply.removeHeader('Server');
  reply.removeHeader('X-Powered-By');
}

module.exports = { applySecurityHeaders, applyRelaxedSecurityHeaders };