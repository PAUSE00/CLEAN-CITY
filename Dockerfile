FROM php:8.2-apache

# Setup debugging and necessary PHP extensions for Database
RUN docker-php-ext-install pdo pdo_mysql

# Copy the app files into the Apache DocumentRoot
COPY . /var/www/html/

# Enable URL rewriting just in case
RUN a2enmod rewrite

# Overwrite Apache port to use the dynamic $PORT provided by Railway at runtime
CMD sed -i "s/80/$PORT/g" /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf && docker-php-entrypoint apache2-foreground
