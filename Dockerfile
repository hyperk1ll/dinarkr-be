FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source code
COPY . .

# Expose port (default for express is usually 7000 in this project based on standard setups)
EXPOSE 7000

# Start the application
CMD ["npm", "start"]
