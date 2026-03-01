FROM php:8.2-apache

# Install PDO MySQL to connect to Railway Database
RUN docker-php-ext-install pdo pdo_mysql

# Copy all project files to the web directory
COPY . /var/www/html/

# Enable Apache rewrite module
RUN a2enmod rewrite

# Copy startup script and make it executable
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Use the startup script which properly expands the $PORT variable
CMD ["/start.sh"]
