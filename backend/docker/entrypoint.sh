#!/bin/sh
set -eu

if [ "$#" -gt 0 ]; then
    exec "$@"
fi

attempt=0
until php -r 'new PDO("mysql:host=".getenv("DB_HOST").";port=".(getenv("DB_PORT") ?: 3306).";dbname=".getenv("DB_DATABASE"), getenv("DB_USERNAME"), getenv("DB_PASSWORD"));' 2>/dev/null; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge 30 ]; then
        echo "MySQL no estuvo disponible despues de 60 segundos." >&2
        exit 1
    fi
    sleep 2
done

php artisan migrate --force
php artisan db:seed --force
php artisan notifications:generate
php artisan config:cache

exec php artisan serve --host=0.0.0.0 --port=80
