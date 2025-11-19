# Render Deployment Guide for HealthHire Portal

## Puppeteer PDF Generation on Render

This application uses Puppeteer for PDF generation. Render requires special configuration to support Chromium.

### Option 1: Using render.yaml (Recommended)

The `render.yaml` file in the root includes the necessary build commands to install Chromium.

### Option 2: Manual Configuration in Render Dashboard

If not using render.yaml, configure these settings in your Render service:

#### Build Command:
```bash
apt-get update && apt-get install -y chromium chromium-driver && npm install && npm run build
```

#### Environment Variables:
```
NODE_ENV=production
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

### Option 3: Using Docker (Alternative)

If the above doesn't work, you can use a Docker deployment:

1. Create a `Dockerfile`:
```dockerfile
FROM node:18-slim

# Install Chromium and dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

2. In Render, select "Docker" as the environment type

### Troubleshooting

If PDF generation fails:

1. **Check Logs**: Look for Chromium-related errors in Render logs
2. **Verify Installation**: SSH into your Render instance and check if Chromium is installed:
   ```bash
   which chromium
   ```
3. **Memory Issues**: Increase your Render instance size if you see out-of-memory errors
4. **Timeout Issues**: Increase the PDF generation timeout in the code

### Testing Locally

To test the same configuration locally:
```bash
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium  # or path to your Chrome
npm run dev
```

### Alternative: Switch to a Different PDF Library

If Puppeteer continues to be problematic on Render, consider alternatives:
- `pdfkit` - Lighter weight, but less HTML rendering capability
- `html-pdf-node` - Alternative Puppeteer wrapper
- External PDF API services (e.g., DocRaptor, PDFShift)
