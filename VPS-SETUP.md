# Quick VPS Setup Guide

## Quick Start Commands

### 1. Server Environment Setup
```bash
cd /srv/separnoavari/separnoavari/server
cp env.template .env
nano .env  # Edit with your values
```

### 2. Client Environment Setup
```bash
cd /srv/separnoavari/separnoavari/client
cp env.template .env
nano .env  # Edit with your values
```

### 3. Install Dependencies
```bash
# Server
cd /srv/separnoavari/separnoavari/server
npm install

# Client
cd /srv/separnoavari/separnoavari/client
npm install
npm run build
```

### 4. Setup Nginx
```bash
sudo cp nginx-separnoavari.conf /etc/nginx/sites-available/separnoavari
sudo ln -s /etc/nginx/sites-available/separnoavari /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Start Server with PM2
```bash
cd /srv/separnoavari/separnoavari/server
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions
```

## Environment Variables Reference

### Server (.env)
- `NODE_ENV=production`
- `PORT=5000`
- `ALLOWED_ORIGINS=https://www.separnoavari.ir,https://separnoavari.ir`
- `UPLOADS_DIR=/srv/separnoavari/separnoavari/server/uploads`
- `ADMIN_FILE_ROUTE_PREFIX=/api/admin/files`
- `SESSION_SECRET=<generate-random-string>`

### Client (.env)
- `VITE_API_BASE=https://www.separnoavari.ir/api`
- `VITE_ADMIN_FILE_ROUTE_PREFIX=/api/admin/files`
- `VITE_IDEA_DEADLINE=2025-10-10T20:30:00+03:30`
- `VITE_RESULTS_DATE=2025-11-01T10:00:00+03:30`
- `VITE_CLOSING_CEREMONY=2025-11-10T18:00:00+03:30`

For detailed instructions, see `DEPLOYMENT.md`

