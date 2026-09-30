FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-interaction --prefer-dist --no-scripts --optimize-autoloader

FROM php:8.4-cli-alpine
RUN apk add --no-cache curl libzip-dev oniguruma-dev sqlite-dev mysql-client \
    && docker-php-ext-install bcmath mbstring pdo_mysql pdo_sqlite zip
WORKDIR /var/www/html
COPY --from=vendor /app/vendor ./vendor
COPY . .
RUN chmod +x docker/entrypoint.sh \
    && cp .env.example .env \
    && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && php artisan package:discover --ansi
EXPOSE 80
ENTRYPOINT ["/var/www/html/docker/entrypoint.sh"]
