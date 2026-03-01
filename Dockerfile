FROM php:8.2-apache

# Install PDO MySQL to connect to the Database
RUN docker-php-ext-install pdo pdo_mysql

# Enable Apache rewrite module
RUN a2enmod rewrite

# Copy all project files
COPY . /var/www/html/

# Hardcode Apache to listen on port 8080 instead of 80
RUN sed -i 's/80/8080/g' /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf

# Fix MPM configuration error the correct Debian way
RUN a2dismod mpm_event mpm_worker || true \
    && a2enmod mpm_prefork || true

# Expose port 8080 so Railway knows exactly where to route traffic
EXPOSE 8080
