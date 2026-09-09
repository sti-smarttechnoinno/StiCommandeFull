# Global build arg for PHP version (available in all stages)
# NOTE: php:8.5-fpm-alpine may not be published yet on Docker Hub at build time.
# Override with --build-arg PHP_VERSION=8.4 if the 8.5 tag isn't available.
ARG PHP_VERSION=8.5

# =========================================================
# Stage 1: Install PHP Composer Dependencies
# =========================================================
# Built on a real PHP base (not the bare composer image) with the SAME
# extensions as the Stage 3 runtime, so composer.json's "require" platform
# checks pass for real and we no longer need --ignore-platform-reqs.
FROM docker.io/library/php:${PHP_VERSION}-cli-alpine AS composer_builder

ENV COMPOSER_ALLOW_SUPERUSER=1

# Install just the build deps + extensions composer.json actually requires
RUN apk update && apk add --no-cache \
    $PHPIZE_DEPS \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    icu-dev \
    libpq-dev \
    sqlite-dev \
    oniguruma-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        bcmath \
        exif \
        gd \
        intl \
        mbstring \
        pdo_mysql \
        pdo_pgsql \
        pdo_sqlite \
        pgsql \
        zip

# Bring in the official Composer binary
COPY --from=docker.io/library/composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy composer definitions
COPY composer.json composer.lock ./

# Install production dependencies without dev packages or scripts
# (no --ignore-platform-reqs: extensions above now genuinely satisfy requirements)
RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts

# Copy application code to generate complete autoloader
COPY . .
RUN composer dump-autoload --optimize --no-scripts

# =========================================================
# Stage 2: Build Frontend Assets (Vite / React / Tailwind)
# =========================================================
FROM docker.io/library/node:20-alpine AS node_builder

WORKDIR /app

# Copy dependency definitions & clean install
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source code
COPY . .

# Build Vite production bundle
RUN npm run build

# Remove development dependencies to keep production footprint minimal
RUN npm prune --omit=dev

# =========================================================
# Stage 3: Production Runtime (PHP FPM + Nginx + WebSockets)
# =========================================================
FROM docker.io/library/php:${PHP_VERSION}-fpm-alpine

LABEL maintainer="StiCommande DevOps Team"
LABEL description="Production Docker image for StiCommande Backend (PHP + Laravel + Nginx + WebSockets)"

WORKDIR /var/www/commande/backend

# Install runtime packages, Nginx, Supervisor, Node.js and all PHP extensions via official installer
RUN curl -sSLf https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions -o /usr/local/bin/install-php-extensions \
    && chmod +x /usr/local/bin/install-php-extensions \
    && apk update && apk add --no-cache \
        bash \
        curl \
        nginx \
        supervisor \
        nodejs \
    && install-php-extensions \
        bcmath \
        exif \
        gd \
        intl \
        mbstring \
        opcache \
        pcntl \
        pdo_mysql \
        pdo_pgsql \
        pdo_sqlite \
        pgsql \
        zip \
        redis

# Copy configuration files
COPY docker/php.ini /usr/local/etc/php/conf.d/custom.ini
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh

# Copy application source code
COPY . /var/www/commande/backend

# Copy pre-built vendor packages from composer_builder
COPY --from=composer_builder /app/vendor /var/www/commande/backend/vendor

# Copy compiled public assets and production node modules from node_builder
COPY --from=node_builder /app/public/build /var/www/commande/backend/public/build
COPY --from=node_builder /app/node_modules /var/www/commande/backend/node_modules

# Prepare directory structure, clean stale cache, and set permissions
RUN rm -rf /var/www/commande/backend/bootstrap/cache/*.php \
    && mkdir -p \
    /var/www/commande/backend/storage/framework/cache/data \
    /var/www/commande/backend/storage/framework/sessions \
    /var/www/commande/backend/storage/framework/views \
    /var/www/commande/backend/storage/logs \
    /var/www/commande/backend/bootstrap/cache \
    /run/nginx \
    /var/log/supervisor \
    && touch /var/www/commande/backend/storage/logs/laravel.log \
    && chown -R www-data:www-data /var/www/commande/backend/storage /var/www/commande/backend/bootstrap/cache \
    && chmod -R 775 /var/www/commande/backend/storage /var/www/commande/backend/bootstrap/cache \
    && chmod -R 775 /var/www/commande/backend/storage/logs

# Expose HTTP port (80) and WebSocket Hub port (8085)
EXPOSE 80 8085

# Healthcheck checking both Laravel's /up endpoint and the websocket hub's /health
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost/up && curl -f http://localhost:8085/health || exit 1

# Default supervisor daemon environment variables
ENV START_WEBSOCKET=true \
    START_QUEUE_WORKER=false

# Use SIGTERM so supervisord shuts down gracefully without 10s SIGQUIT timeout
STOPSIGNAL SIGTERM

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]