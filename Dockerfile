FROM php:8.2-cli

# Install PDO MySQL extension
RUN docker-php-ext-install pdo pdo_mysql

# Set working directory
WORKDIR /app

# Copy all application files
COPY . .

# Expose port (Railway sets PORT dynamically)
EXPOSE ${PORT:-8080}

# Use shell form so $PORT is expanded by sh at runtime
CMD php -S 0.0.0.0:$PORT
