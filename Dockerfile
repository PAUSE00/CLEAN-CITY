FROM php:8.2-apache

# Install PDO MySQL to connect to Railway Database
RUN docker-php-ext-install pdo pdo_mysql

# Copy all project files to the web directory
COPY . /var/www/html/

# Enable Apache rewrite module
RUN a2enmod rewrite

# Use shell form CMD so $PORT is expanded at runtime by /bin/sh
CMD sed -i "s/80/$PORT/g" /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf && apache2-foreground
