#!/bin/bash
# Replace Apache's default port 80 with Railway's dynamic $PORT
sed -i "s/80/${PORT}/g" /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf
# Start Apache
apache2-foreground
