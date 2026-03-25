# Fair Launch Backend - Deployment Guide

Complete guide for deploying the Fair Launch backend event listener.

---

## 📋 Prerequisites

- Server with Node.js v18+ installed
- SSH access to server
- Platform wallet keypair (mainnet-wallet.json)
- PM2 for process management
- Fair Launch program IDL file

---

## 🚀 Quick Deploy

### 1. Setup Directory
```bash
mkdir -p ~/fair-launch-backend
cd ~/fair-launch-backend
```

### 2. Create package.json
```json
{
  "name": "fair-launch-backend",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "node test-listener.js"
  },
  "dependencies": {
    "@coral-xyz/anchor": "^0.30.1",
    "@solana/web3.js": "^1.95.0",
    "@solana/spl-token": "^0.4.0",
    "dotenv": "^16.0.3"
  }
}
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Transfer Files

From your local machine:
```bash
# Transfer wallet (SECURE!)
scp -P YOUR_SSH_PORT mainnet-wallet.json your-user@YOUR_SERVER_IP:~/mainnet-wallet.json

# Transfer IDL
scp -P YOUR_SSH_PORT fair_launch_program.json your-user@YOUR_SERVER_IP:~/fair-launch-backend/
```

On server:
```bash
chmod 600 ~/mainnet-wallet.json
```

### 5. Configure Environment

Create `.env`:
```bash
SOLANA_RPC_URL=https://rpc.mainnet.x1.xyz
SOLANA_WS_URL=wss://rpc.mainnet.x1.xyz
PROGRAM_ID=2NWX2Tn5ywkAEUiHxPm5Y28vQAghrDzHcMe78fv2NYye
PLATFORM_WALLET_PATH=/home/your-user/mainnet-wallet.json
XNT_MINT=So11111111111111111111111111111111111111112
RETRY_MAX_ATTEMPTS=5
RETRY_INITIAL_DELAY_MS=1000
```

### 6. Test Configuration
```bash
npm run test
```

### 7. Start Service
```bash
# Install PM2
sudo npm install -g pm2

# Start service
pm2 start index.js --name fair-launch-backend

# Save and setup auto-restart
pm2 save
pm2 startup
# Run the command PM2 outputs
pm2 save
```

---

## 📊 Monitoring

### View Logs
```bash
pm2 logs fair-launch-backend
```

### Check Status
```bash
pm2 status
pm2 info fair-launch-backend
```

### Restart Service
```bash
pm2 restart fair-launch-backend
```

---

## 🔧 Troubleshooting

### Service Won't Start

1. Check logs: `pm2 logs fair-launch-backend --err`
2. Verify .env file exists
3. Check wallet permissions: `ls -la ~/mainnet-wallet.json`
4. Test RPC connection: `npm run test`

### No Events Detected

1. Check program activity: `solana logs 2NWX2Tn5ywkAEUiHxPm5Y28vQAghrDzHcMe78fv2NYye`
2. Verify WebSocket connection in logs
3. Check subscription ID is > 0

### Pool Creation Fails

1. Check error in logs
2. Verify xDEX SDK is installed (after integration)
3. Check wallet has sufficient balance
4. Review retry attempts in logs

---

## 🔒 Security

- ✅ Wallet file: chmod 600
- ✅ Run as non-root user
- ✅ No secrets in code
- ✅ Environment variables in .env
- ✅ .env in .gitignore

---

## 📈 Production Checklist

- [ ] Server has 99%+ uptime
- [ ] PM2 auto-restart configured
- [ ] Wallet secured (chmod 600)
- [ ] Monitoring/alerts setup
- [ ] Backup wallet stored securely
- [ ] Service starts on reboot
- [ ] Logs rotation configured
- [ ] Firewall configured

---

## 📞 Support

- GitHub: https://github.com/omenpotter/fair-launch-program
- Server: your-user@YOUR_SERVER_IP:YOUR_SSH_PORT
- Service: fair-launch-backend (PM2)
