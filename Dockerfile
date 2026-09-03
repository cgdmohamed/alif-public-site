# Alef Future public site + admin panel + API — single image.
# Serves the static site and the Express API from one Node process
# (see server/src/index.js, which resolves the static root two levels
# above itself — i.e. this image's /app).

FROM node:20-alpine

WORKDIR /app

# Install server dependencies first so this layer caches across rebuilds
# that only touch site/content files.
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev

# Now bring in the rest of the repo: static site (index.html, css/, js/,
# admin/, assets/) plus the server source.
COPY . .

WORKDIR /app/server

EXPOSE 5522

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:5522/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# schema.sql uses IF NOT EXISTS and seed.js checks for existing rows before
# inserting, so running both on every boot is safe and idempotent — no
# separate one-off migration container needed.
CMD ["sh", "-c", "node src/migrate.js && node src/seed.js && node src/index.js"]
