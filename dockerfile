# Use official Node.js image
FROM node:16

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy app source code
COPY . .

# Expose the app on port 3000
EXPOSE 3000

# Run the app
CMD ["npm", "start"]
