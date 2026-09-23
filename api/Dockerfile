FROM php:8.3-apache

RUN docker-php-ext-install pdo_mysql

COPY api/ /var/www/html/

RUN a2enmod headers

EXPOSE 80