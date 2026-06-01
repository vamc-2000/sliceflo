# Use the official Node.js 20 image as the base
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if it exists)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js application with environment file

# Build the application
RUN npm run build

# Expose port 5000
EXPOSE 5000

# Command to start the Next.js application on port 5000
CMD ["npm", "start", "--", "-p", "5000"]
