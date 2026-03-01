FROM php:8.2-cli

# Install PDO MySQL extension
RUN docker-php-ext-install pdo pdo_mysql

# Set working directory
WORKDIR /app

# Copy all application files
COPY . .

# Expose port 8080 explicitly for Railway
EXPOSE 8080

# Start PHP built-in server statically on 8080
CMD ["php", "-S", "0.0.0.0:8080"]
