FROM php:8.2-apache

# Install PDO MySQL extension
RUN docker-php-ext-install pdo pdo_mysql

# Copy application files
COPY . /var/www/html/

# Configure Apache to listen on the dynamic $PORT environment variable provided by Railway
RUN echo "Listen \${PORT}" > /etc/apache2/ports.conf
RUN echo "<VirtualHost *:\${PORT}>\n\tDocumentRoot /var/www/html\n\tErrorLog \${APACHE_LOG_DIR}/error.log\n\tCustomLog \${APACHE_LOG_DIR}/access.log combined\n</VirtualHost>" > /etc/apache2/sites-available/000-default.conf

# Enable Apache mod_rewrite
RUN a2enmod rewrite
