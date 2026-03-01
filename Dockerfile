FROM php:8.2-apache

# Install PDO MySQL to connect to Railway Database
RUN docker-php-ext-install pdo pdo_mysql

# Copy all project files to the web directory
COPY . /var/www/html/

# Enable Apache rewrite module
RUN a2enmod rewrite

# Create startup script inline (avoids CRLF issues from Windows)
RUN printf '#!/bin/bash\nsed -i "s/80/${PORT}/g" /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf\napache2-foreground\n' > /start.sh && chmod +x /start.sh

# Use the startup script which properly expands the $PORT variable
CMD ["/bin/bash", "/start.sh"]
