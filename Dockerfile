FROM node:20-alpine

WORKDIR /app

# Install Root Dependencies (Angular)
COPY package*.json ./
RUN npm ci

# Install Backend Dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci

# Copy Source Code
COPY . .

# Build Frontend and Backend
# This runs "ng build" (frontend) and "tsc" (backend)
RUN npm run build:all

# Cleanup (optional: remove devDependencies to save space, but kept simple here)
# RUN npm prune --production && cd backend && npm prune --production

EXPOSE 3000

# Start command
CMD ["npm", "run", "start:prod"]
