# Fair Launch Backend Service

24/7 event listener for automatic xDEX pool creation when Fair Launch tokens graduate.

## 🎯 Purpose

Monitors the Fair Launch program for graduation events and automatically:
1. Creates xDEX liquidity pools
2. Burns LP tokens (locks liquidity forever)
3. Marks pools as created on-chain

## 🏗️ Architecture
```
Fair Launch Program → PoolReadyEvent → Backend Listener → xDEX Pool Creation
```

## 📦 Components

- **index.js** - Main service entry point
- **event-listener.js** - WebSocket event monitoring
- **pool-creator.js** - xDEX pool creation logic
- **test-event-detection.js** - Connection & event testing

## 🚀 Quick Start

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment guide.
```bash
npm install
npm run test
pm2 start index.js --name fair-launch-backend
```

## ⚙️ Configuration

Environment variables in `.env`:
```
SOLANA_RPC_URL=https://rpc.mainnet.x1.xyz
PROGRAM_ID=2NWX2Tn5ywkAEUiHxPm5Y28vQAghrDzHcMe78fv2NYye
PLATFORM_WALLET_PATH=/path/to/wallet.json
```

## 📊 Status

✅ Event Detection: WORKING  
⚠️ xDEX Integration: PENDING SDK

See [INTEGRATION_STATUS.md](./INTEGRATION_STATUS.md) for details.

## 🔗 Links

- Fair Launch Program: https://github.com/omenpotter/fair-launch-program
- xDEX Documentation: https://xdex-xyz.gitbook.io/xdex-docs
- X1 Blockchain: https://x1.xyz
