FROM php:8.2-apache

# Install PDO MySQL to connect to the Database
RUN docker-php-ext-install pdo pdo_mysql

# Enable Apache rewrite module
RUN a2enmod rewrite

# Copy all project files
COPY . /var/www/html/

# Hardcode Apache to listen on port 8080 instead of 80
RUN sed -i 's/80/8080/g' /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf

# Fix MPM configuration error by ensuring only mpm_prefork is loaded 
# (php:8.2-apache already enables mpm_prefork, but sometimes local files conflict)
RUN rm -f /etc/apache2/mods-enabled/mpm_event.conf /etc/apache2/mods-enabled/mpm_worker.conf /etc/apache2/mods-enabled/mpm_event.load /etc/apache2/mods-enabled/mpm_worker.load

# Expose port 8080 so Railway knows exactly where to route traffic
EXPOSE 8080
