# ─────────────────────────────────────────────
# Stage 1: BUILD
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy dependency manifests first (layer-cache friendly)
COPY package.json package-lock.json ./

# Install all dependencies (including devDeps needed for ng build)
RUN npm ci --legacy-peer-deps

# Copy the rest of the source code
COPY . .

# Build Angular app in production mode
# Output goes to dist/Hrms_Shell  (matches angular.json outputPath)
# SASS_SILENCE_DEPRECATION_WARNINGS suppresses the lighten()/darken() noise
RUN SASS_SILENCE_DEPRECATION_WARNINGS=1 npm run build -- --configuration production

# ─────────────────────────────────────────────
# Stage 2: SERVE with Nginx
# ─────────────────────────────────────────────
FROM nginx:alpine AS production

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy built Angular app from builder stage
COPY --from=builder /app/dist/Hrms_Shell/browser /usr/share/nginx/html

# Copy custom Nginx config (handles Angular routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
