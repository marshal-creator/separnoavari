# Separ Noavari VPS Deployment Guide

This guide will help you deploy the Separ Noavari application on your VPS.

## Prerequisites

- Ubuntu/Debian VPS (or similar Linux distribution)
- Node.js 18+ and npm installed
- Nginx installed
- SSL certificate (Let's Encrypt recommended)
- Domain name pointing to your VPS IP

## Step 1: Server Setup

### 1.1 Install Node.js

```bash
# Install Node.js 18+ using NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 1.2 Install Nginx

```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 1.3 Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

## Step 2: Application Setup

### 2.1 Clone/Upload Application

```bash
# Create directory
sudo mkdir -p /srv/separnoavari
cd /srv/separnoavari

# Upload your application files here or clone from git
# Make sure the structure is:
# /srv/separnoavari/separnoavari/
#   ├── client/
#   └── server/
```

### 2.2 Set Permissions

```bash
sudo chown -R $USER:$USER /srv/separnoavari
```

## Step 3: Server Configuration

### 3.1 Configure Server Environment

```bash
cd /srv/separnoavari/separnoavari/server
cp .env.example .env
nano .env
```

Update the `.env` file with your production values:

```env
NODE_ENV=production
PORT=5000
ALLOWED_ORIGINS=https://www.separnoavari.ir,https://separnoavari.ir
UPLOADS_DIR=/srv/separnoavari/separnoavari/server/uploads
ADMIN_FILE_ROUTE_PREFIX=/api/admin/files
SESSION_SECRET=<generate-a-strong-random-string>
```

Generate a session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.2 Install Server Dependencies

```bash
cd /srv/separnoavari/separnoavari/server
npm install
```

### 3.3 Initialize Database

```bash
npm run init-db
```

## Step 4: Client Configuration

### 4.1 Configure Client Environment

```bash
cd /srv/separnoavari/separnoavari/client
cp .env.example .env
nano .env
```

Update the `.env` file:

```env
VITE_API_BASE=https://www.separnoavari.ir/api
VITE_ADMIN_FILE_ROUTE_PREFIX=/api/admin/files
VITE_IDEA_DEADLINE=2025-10-10T20:30:00+03:30
VITE_RESULTS_DATE=2025-11-01T10:00:00+03:30
VITE_CLOSING_CEREMONY=2025-11-10T18:00:00+03:30
```

### 4.2 Build Client

```bash
cd /srv/separnoavari/separnoavari/client
npm install
npm run build
```

The built files will be in `client/dist/`

## Step 5: SSL Certificate (Let's Encrypt)

### 5.1 Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 5.2 Obtain SSL Certificate

```bash
sudo certbot --nginx -d separnoavari.ir -d www.separnoavari.ir
```

Follow the prompts. Certbot will automatically configure Nginx.

## Step 6: Nginx Configuration

### 6.1 Copy Nginx Config

```bash
sudo cp nginx-separnoavari.conf /etc/nginx/sites-available/separnoavari
```

### 6.2 Update SSL Certificate Paths

Edit the config file if needed:
```bash
sudo nano /etc/nginx/sites-available/separnoavari
```

Update the SSL certificate paths if they differ from the default Let's Encrypt paths.

### 6.3 Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/separnoavari /etc/nginx/sites-enabled/
```

### 6.4 Test and Reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Step 7: Start Application with PM2

### 7.1 Create PM2 Ecosystem File (Optional)

Create `ecosystem.config.js` in the server directory:

```javascript
module.exports = {
  apps: [{
    name: 'separnoavari-server',
    script: './index.mjs',
    cwd: '/srv/separnoavari/separnoavari/server',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
```

### 7.2 Start Server with PM2

```bash
cd /srv/separnoavari/separnoavari/server
pm2 start index.mjs --name separnoavari-server
# Or if using ecosystem file:
# pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs
```

## Step 8: Firewall Configuration

```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable
```

## Step 9: Verify Deployment

1. Check server is running:
   ```bash
   pm2 status
   pm2 logs separnoavari-server
   ```

2. Check Nginx:
   ```bash
   sudo systemctl status nginx
   ```

3. Test your domain in a browser:
   - https://www.separnoavari.ir
   - https://separnoavari.ir

## Maintenance Commands

### Restart Server
```bash
pm2 restart separnoavari-server
```

### View Server Logs
```bash
pm2 logs separnoavari-server
```

### Restart Nginx
```bash
sudo systemctl restart nginx
```

### Update Application

```bash
# Pull latest changes (if using git)
cd /srv/separnoavari/separnoavari
git pull

# Rebuild client
cd client
npm install
npm run build

# Restart server
cd ../server
pm2 restart separnoavari-server
```

### Renew SSL Certificate

```bash
sudo certbot renew
sudo systemctl reload nginx
```

## Troubleshooting

### Check Server Logs
```bash
pm2 logs separnoavari-server
tail -f /var/log/nginx/separnoavari-error.log
```

### Check if Port 5000 is in use
```bash
sudo netstat -tulpn | grep 5000
```

### Test Nginx Configuration
```bash
sudo nginx -t
```

### Check File Permissions
```bash
# Ensure uploads directory is writable
sudo chmod -R 755 /srv/separnoavari/separnoavari/server/uploads
```

## Security Notes

1. Keep Node.js and npm updated
2. Regularly update dependencies: `npm audit fix`
3. Use strong session secrets
4. Keep SSL certificates renewed
5. Regularly check server logs for suspicious activity
6. Consider setting up a firewall (UFW) with minimal required ports

## Backup

Regularly backup:
- Database: `/srv/separnoavari/separnoavari/server/database.db`
- Uploads: `/srv/separnoavari/separnoavari/server/uploads/`
- Environment files: `.env` files (store securely)

```bash
# Example backup script
tar -czf backup-$(date +%Y%m%d).tar.gz \
  /srv/separnoavari/separnoavari/server/database.db \
  /srv/separnoavari/separnoavari/server/uploads
```

