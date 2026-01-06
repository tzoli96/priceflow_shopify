FROM node:20-alpine

WORKDIR /app
RUN npm i -g pnpm

# Copy package files
COPY package*.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile=false

# Copy application code
COPY . .

EXPOSE 5173
CMD ["pnpm", "dev"]