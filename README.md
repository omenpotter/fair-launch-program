# Fair Launch Program

**Pump.fun-style token launches on X1 blockchain**

![Status](https://img.shields.io/badge/status-mainnet-success)
![Network](https://img.shields.io/badge/network-X1-blue)

## 🎯 Overview

The Fair Launch Program enables fixed-economics token launches with automatic liquidity provision on X1 blockchain. Features platform-controlled pricing, graduated launches, and built-in anti-rug mechanisms.

## 📊 Program Information

- **Program ID**: `2NWX2Tn5ywkAEUiHxPm5Y28vQAghrDzHcMe78fv2NYye`
- **Network**: X1 Mainnet
- **Deployment**: March 24, 2026
- **Size**: 330 KB
- **Status**: ✅ Production Ready

## 🪙 Token Economics

### Fixed Distribution (Permanent):
```
Total Supply: 1,000,000,000 tokens (1B)

Distribution:
├─ 80% (800M) → Public Sale (mintable by users)
├─ 15% (150M) → XDEX Liquidity Pool
├─ 3% (30M) → Platform (locked 90 days)
└─ 2% (20M) → Burned at graduation
```

### XNT Revenue Splits (Permanent):
```
From total XNT raised:
├─ 5% → Creator (paid at graduation only)
├─ 3% → Platform (paid at graduation only)
└─ 92% → XDEX Liquidity Pool
```

### Flexible Economics (Admin Controlled):
```
Adjustable based on XNT price:
├─ mint_price: XNT per token
├─ target_xnt: XNT to graduate
└─ creation_fee: Fee to create token

Default (XNT = $1):
├─ Mint price: 0.00001404 XNT per token
├─ Target: 11,232 XNT to graduate (~$11,232)
└─ Creation fee: 1 XNT
```

## 🔑 Key Features

✅ **Fixed Token Distribution** - 80/15/3/2 split (permanent)  
✅ **Flexible Pricing** - Adjusts with XNT price changes  
✅ **Platform Token Lock** - 90 days via Liquidity Lock program  
✅ **Auto-Graduation** - At 100% minted  
✅ **XDEX Integration** - Automatic pool creation  
✅ **No Refunds** - Fail is fail (like Pump.fun)  
✅ **Safety Limits** - 10x range on price adjustments  

## 🚀 Quick Start

### Installation
```bash
npm install @coral-xyz/anchor @solana/web3.js @solana/spl-token
```

### Initialize Platform Config (One-time, Admin Only)
```javascript
const platformConfigPDA = PublicKey.findProgramAddressSync(
  [Buffer.from("platform_config")],
  PROGRAM_ID
)[0];

await program.methods
  .initializePlatformConfig()
  .accounts({
    admin: adminWallet.publicKey,
    platformConfig: platformConfigPDA,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### Create Fair Launch Token
```javascript
const tokenMint = Keypair.generate();
const [fairLaunchPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("fair_launch"), tokenMint.publicKey.toBuffer()],
  PROGRAM_ID
);

await program.methods
  .initialize("My Token", "MTK", new BN(10_000))
  .accounts({
    authority: wallet.publicKey,
    platformConfig: platformConfigPDA,
    fairLaunch: fairLaunchPDA,
    tokenMint: tokenMint.publicKey,
    ...
  })
  .signers([tokenMint])
  .rpc();
```

### Mint Tokens
```javascript
await program.methods
  .mintTokens(new BN(1000))
  .accounts({
    user: wallet.publicKey,
    fairLaunch: fairLaunchPDA,
    tokenMint: tokenMint.publicKey,
    userMints: userMintsPDA,
    userXntAccount: userXntATA,
    escrowXntAccount: escrowXntATA,
    userTokenAccount: userTokenATA,
    ...
  })
  .rpc();
```

## 📖 Instructions

### Admin Instructions

**initialize_platform_config()**
- Creates platform configuration (one-time)
- Sets initial pricing parameters
- Admin only

**update_platform_config(new_mint_price?, new_target_xnt?, new_creation_fee?)**
- Updates pricing parameters
- Enforces safety limits (10x range)
- Admin only

### User Instructions

**initialize(name, symbol, max_per_wallet)**
- Creates new fair launch token
- Reads current pricing from platform config
- Fixed 80/15/3/2 distribution

**mint_tokens(amount)**
- Mints tokens to user
- Transfers XNT to escrow
- Checks per-wallet limits
- Auto-graduates at 100%

**graduate()**
- Pays creator (5%) and platform (3%)
- Locks platform tokens for 90 days
- Burns 2% of supply
- Emits pool ready event

**mark_pool_created(pool_address)**
- Called by backend after XDEX pool creation
- Marks token as complete

## 🔒 Security Features

### Platform Token Lock
- Auto-locked for 90 days at graduation
- Uses Liquidity Lock program (CPI)
- Prevents platform dump
- Transparent on-chain

### Safety Limits
```
Min/Max ranges (10x):
├─ Mint price: 1,404 - 140,400 lamports
├─ Target XNT: 1.1T - 112T lamports
└─ Creation fee: 0.1 - 10 XNT
```

### Economic Protection
- Creator paid only at graduation
- No refunds if fails
- LP tokens burned (permanent liquidity)
- Per-wallet limits enforced

## 🎨 Token Address Format

All Fair Launch tokens end with suffix: **"nxs"**

Example: `ABC123...xyz456nxs`

## 📊 Revenue Model

### Per Successful Launch:
```
Platform earns:
├─ Creation fee: 1 XNT ($1)
├─ Graduation: 336.96 XNT ($336.96)
├─ Tokens: 30M (locked 90d, ~$2,066 value)
└─ Total: ~$2,404 per successful launch
```

### Per Failed Launch:
```
Platform earns:
├─ Creation fee: 1 XNT ($1)
└─ Worthless tokens (no liquidity)
```

## 🔗 Integration

### Backend Event Listener
Monitor for `PoolReadyEvent`:
```javascript
connection.onLogs(PROGRAM_ID, (logs) => {
  // Detect PoolReadyEvent
  // Call XDEX API to create pool
  // Call mark_pool_created()
});
```

### XDEX Pool Creation
```javascript
// When PoolReadyEvent detected
const pool = await xdexAPI.createPool({
  network: "X1 Mainnet",
  tokenA: tokenMint,
  tokenB: XNT_MINT,
  amountA: 150_000_000,
  amountB: poolXNT,
});

// Burn LP tokens
await burnLPTokens(pool.lpMint);

// Mark as created
await program.methods
  .markPoolCreated(pool.address)
  .rpc();
```

## 📚 Documentation

- [Admin Setup Guide](./docs/ADMIN_SETUP.md) - Initialize and manage platform
- [Backend Integration](./docs/BACKEND_INTEGRATION.md) - Event listeners and XDEX
- [Deployment Guide](./docs/DEPLOYMENT.md) - X1 mainnet deployment

## 🌐 Network Details

- **X1 Mainnet RPC**: https://rpc.mainnet.x1.xyz
- **XDEX API**: https://api.xdex.xyz
- **Program ID**: 2NWX2Tn5ywkAEUiHxPm5Y28vQAghrDzHcMe78fv2NYye

## 🔗 Links

- [X1 Blockchain](https://x1.xyz)
- [XDEX Documentation](https://xdex-xyz.gitbook.io/xdex-docs)
- [Liquidity Lock Program](https://github.com/omenpotter/liquidity-lock-program)
- [Vesting Halving Program](https://github.com/omenpotter/vesting-halving-program)

## 📄 License

MIT License

## 🙏 Built For

X1Nexus - Comprehensive token launch platform for X1 blockchain

**Companion Programs:**
- [Liquidity Lock](https://github.com/omenpotter/liquidity-lock-program) - Time-lock any SPL token
- [Vesting Halving](https://github.com/omenpotter/vesting-halving-program) - Bitcoin-style vesting

---

## ⚠️ Important Notes

- Platform tokens locked 90 days (prevents dump)
- Creator gets NO tokens (only XNT at graduation)
- No refunds if token doesn't graduate
- Minting stays open forever (unless graduated)
- Admin controls pricing (with safety limits)

---

**Fair launches on X1. Fixed economics. Aligned incentives.** 🚀
