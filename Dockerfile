FROM php:8.2-apache

# Install PDO MySQL to connect to the Database
RUN docker-php-ext-install pdo pdo_mysql

# Enable Apache rewrite module
RUN a2enmod rewrite

# Copy all project files
COPY . /var/www/html/

# Hardcode Apache to listen on port 8080 instead of 80
RUN sed -i 's/80/8080/g' /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf

# To bypass the "More than one MPM loaded" error that Railway's environment 
# seems to trigger with apache2-foreground, we will use a simple script 
# to start Apache gracefully in the background, and then keep the container alive.
RUN printf '#!/bin/bash\nservice apache2 start\ntail -f /var/log/apache2/error.log\n' > /start.sh && chmod +x /start.sh

# Expose port 8080
EXPOSE 8080

CMD ["/start.sh"]
