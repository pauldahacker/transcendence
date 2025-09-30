/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   server.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/19 03:23:43 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/09/30 04:09:00 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// api-gateway/server.js
const Fastify = require("fastify");
const fs = require("fs");
const path = require("path");

const USE_HTTP = process.env.USE_HTTP === "1";
const PORT = Number(process.env.PORT || (USE_HTTP ? 3000 : 443));
const HOST = process.env.HOST || "0.0.0.0";

// Build fastify instance (no auto-listen)
function build() {
  const fastify = USE_HTTP
    ? Fastify({ logger: true })
    : Fastify({
        logger: true,
        https: {
          key: fs.readFileSync(path.join(__dirname, "../certs/localhost-key.pem")),
          cert: fs.readFileSync(path.join(__dirname, "../certs/localhost.pem")),
        },
      });

  // CORS: permissive in dev; tighten later
  fastify.register(require("@fastify/cors"), {
    origin: (origin, cb) => cb(null, true),
    credentials: true,
  });

  // Security headers (optional)
  try {
    fastify.register(require("@fastify/helmet"), { global: true, contentSecurityPolicy: false });
  } catch (_) {}

  // Health
  fastify.get("/healthz", async () => ({ status: "ok" }));

  // Proxy to services
  const proxy = require("@fastify/http-proxy");

  // auth service (inside compose network)
  fastify.register(proxy, {
    upstream: process.env.AUTH_UPSTREAM || "http://auth:3001",
    prefix: "/auth",
    rewritePrefix: "/",
  });

  // tournaments service (JWT-guarded, but for now the gateway only forwards)
  fastify.register(async (instance) => {
    // Minimal guard (future: verify JWT properly and inject x-user-id)
    instance.addHook("onRequest", async (req, rep) => {
      // temporary hack: pass Authorization through; tournaments may require it
      // Later: verify JWT here, then set req.headers['x-user-id'] = <from token>
      return;
    });

    instance.register(proxy, {
      upstream: process.env.TOURN_UPSTREAM || "http://tournaments:3003",
      prefix: "/tournaments",
      rewritePrefix: "/",
    });
  });

  return fastify;
}

async function start() {
  const fastify = build();
  try {
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`[api-gateway] listening on ${USE_HTTP ? "http" : "https"}://${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// If run directly, start once. If imported, only export helpers.
if (require.main === module) {
  start();
}

module.exports = { build, start };
