FROM node:18-alpine

# Install required packages
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    ffmpeg \
    openssl \
    opus-tools \
    sox \
    git \
    espeak-ng \
    wget \
    tar \
    curl \
    sqlite \
    sqlite-dev

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for nodemon)
RUN npm install

# espeak-ng is configured with better voice data

# Copy app files
COPY . .

# Create necessary directories with proper permissions
RUN mkdir -p logs data public/audio/uploads public/audio/presets config temp && \
    chmod -R 755 /app

# Generate SSL certificates if not exist
RUN if [ ! -f config/cert.pem ]; then \
    openssl req -x509 -newkey rsa:4096 -keyout config/key.pem -out config/cert.pem \
    -days 365 -nodes -subj "/C=UZ/ST=Qashqadaryo/L=Qarshi/O=IIB/CN=localhost"; \
    fi

# Set environment (will be overridden by docker-compose)
ENV NODE_ENV=development

# Expose port
EXPOSE 8444

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('https').get('https://localhost:8444/api/test-auth/test-session', {rejectUnauthorized: false}, (res) => {process.exit(res.statusCode === 200 ? 0 : 1);}).on('error', () => {process.exit(1);})"

# Start the application with nodemon for development
CMD ["npm", "run", "dev"]