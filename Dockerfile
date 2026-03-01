FROM php:8.2-apache

# Install PDO MySQL to connect to Railway Database
RUN docker-php-ext-install pdo pdo_mysql

# Copy all files to the public web server directory
COPY . /var/www/html/

# Enable routing/rewrite if needed
RUN a2enmod rewrite

# Railway dynamically assigns a port at runtime via the $PORT variable.
# We use cmd to cleanly swap Apache's default port 80 to $PORT right before starting. 
CMD sed -i "s/80/${PORT:-80}/g" /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf && docker-php-entrypoint apache2-foreground
