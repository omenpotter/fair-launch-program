# Fair Launch Program - Admin Setup Guide

Complete guide for platform administrators to initialize and manage the Fair Launch Program.

---

## 📋 Prerequisites

- Admin wallet with authority
- X1 mainnet access
- Anchor/Solana CLI installed
- Node.js environment

---

## 🚀 Initial Setup (One-Time)

### Step 1: Initialize Platform Config

The platform config must be initialized once before any tokens can be created.
```javascript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("2NWX2Tn5ywkAEUiHxPm5Y28vQAghrDzHcMe78fv2NYye");

// Derive platform config PDA
const [platformConfigPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("platform_config")],
  PROGRAM_ID
);

// Initialize
const tx = await program.methods
  .initializePlatformConfig()
  .accounts({
    admin: adminWallet.publicKey,
    platformConfig: platformConfigPDA,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .rpc();

console.log("✅ Platform config initialized:", tx);
```

**Initial Values (XNT = $1):**
```
Mint Price: 14,040 lamports (0.00001404 XNT)
Target XNT: 11,232,000,000,000 lamports (11,232 XNT)
Creation Fee: 1,000,000,000 lamports (1 XNT)

Safety Limits:
├─ Min Mint Price: 1,404 lamports (10x lower)
├─ Max Mint Price: 140,400 lamports (10x higher)
├─ Min Target XNT: 1,123,200,000,000 lamports
├─ Max Target XNT: 112,320,000,000,000 lamports
```

---

## ⚙️ Managing Platform Config

### Update Pricing (When XNT Price Changes)

**Scenario: XNT price increases to $10**
```javascript
// New values to maintain ~$11,232 target
const newMintPrice = new anchor.BN(1_404); // 10x lower
const newTargetXnt = new anchor.BN(1_123_200_000_000); // 10x lower

const tx = await program.methods
  .updatePlatformConfig(
    newMintPrice,    // new mint price
    newTargetXnt,    // new target XNT
    null             // keep creation fee same
  )
  .accounts({
    admin: adminWallet.publicKey,
    platformConfig: platformConfigPDA,
  })
  .rpc();

console.log("✅ Config updated:", tx);
```

**Calculation Formula:**
```
Target USD Value: $11,232 (constant)
XNT Price: $X (variable)

mint_price = (0.00001404 * 1) / X XNT
target_xnt = (11,232 * 1) / X XNT
```

**Examples:**

| XNT Price | Mint Price (XNT) | Target XNT | USD Target |
|-----------|------------------|------------|------------|
| $1 | 0.00001404 | 11,232 | $11,232 |
| $10 | 0.000001404 | 1,123.2 | $11,232 |
| $100 | 0.0000001404 | 112.32 | $11,232 |
| $0.10 | 0.0001404 | 112,320 | $11,232 |

---

## 🔐 Security Best Practices

### 1. Use Multisig Admin Wallet

**Recommended: Squads Protocol (3-of-5)**
```bash
# Install Squads CLI
npm install -g @sqds/cli

# Create multisig
squads create-multisig \
  --threshold 3 \
  --members wallet1.json,wallet2.json,wallet3.json,wallet4.json,wallet5.json

# Use multisig as admin
```

**Benefits:**
- No single point of failure
- Requires 3 signatures for config changes
- Transparent on-chain
- Can rotate members

### 2. Document All Config Changes

Create a change log:
```markdown
# Platform Config Changes

## 2026-03-24 - Initial Setup
- Mint Price: 0.00001404 XNT
- Target: 11,232 XNT
- Reason: Initial deployment (XNT = $1)

## 2026-04-15 - Price Adjustment
- Mint Price: 0.000001404 XNT (10x lower)
- Target: 1,123.2 XNT (10x lower)
- Reason: XNT price increased to $10
```

### 3. Test Changes on Devnet First

Always test config updates on devnet before mainnet:
```javascript
// Switch to devnet
const connection = new Connection("https://rpc.testnet.x1.xyz");

// Test update
await program.methods
  .updatePlatformConfig(newPrice, newTarget, null)
  .accounts({...})
  .rpc();

// Verify
const config = await program.account.platformConfig.fetch(configPDA);
console.log("New values:", config);

// If good, deploy to mainnet
```

---

## 📊 Monitoring Platform Config

### Check Current Config
```javascript
const config = await program.account.platformConfig.fetch(platformConfigPDA);

console.log("Platform Config:");
console.log("  Admin:", config.admin.toString());
console.log("  Mint Price:", config.mintPrice.toNumber(), "lamports");
console.log("  Target XNT:", config.targetXnt.toString(), "lamports");
console.log("  Creation Fee:", config.creationFee.toString(), "lamports");
console.log("");
console.log("Safety Limits:");
console.log("  Min Mint Price:", config.minMintPrice.toNumber());
console.log("  Max Mint Price:", config.maxMintPrice.toNumber());
console.log("  Min Target XNT:", config.minTargetXnt.toString());
console.log("  Max Target XNT:", config.maxTargetXnt.toString());
```

### Monitor Platform Revenue
```javascript
// Query all graduated tokens
const tokens = await connection.getProgramAccounts(PROGRAM_ID, {
  filters: [
    { dataSize: FairLaunch.LEN },
    {
      memcmp: {
        offset: 8 + 32 + 32 + (4+32) + (4+10) + 8*8 + 1*3 + 8*2,
        bytes: bs58.encode([1]), // graduated = true
      }
    }
  ]
});

console.log(`Total graduated tokens: ${tokens.length}`);

// Calculate revenue
let totalXNT = 0;
let totalTokens = 0;

for (const token of tokens) {
  const fairLaunch = program.coder.accounts.decode("FairLaunch", token.account.data);
  const platformXNT = fairLaunch.xntCollected * 0.03; // 3%
  totalXNT += platformXNT;
  totalTokens += fairLaunch.platformSupply; // 30M per token
}

console.log(`Platform revenue:`);
console.log(`  XNT: ${totalXNT / 1e9} XNT`);
console.log(`  Tokens: ${totalTokens / 1e9}M tokens (locked 90d)`);
```

---

## 🛠️ Common Admin Tasks

### 1. Adjust for XNT Price Change
```bash
# Create script: update-pricing.js
node update-pricing.js --xnt-price 10
```
```javascript
// update-pricing.js
const xntPrice = parseFloat(process.argv[3]); // e.g., 10

const baseMintPrice = 14_040; // at XNT = $1
const baseTargetXnt = 11_232_000_000_000;

const newMintPrice = Math.floor(baseMintPrice / xntPrice);
const newTargetXnt = Math.floor(baseTargetXnt / xntPrice);

console.log(`Updating for XNT = $${xntPrice}`);
console.log(`New mint price: ${newMintPrice} lamports`);
console.log(`New target: ${newTargetXnt} lamports`);

await program.methods
  .updatePlatformConfig(
    new BN(newMintPrice),
    new BN(newTargetXnt),
    null
  )
  .accounts({...})
  .rpc();
```

### 2. Increase Creation Fee (Anti-Spam)
```javascript
// If spam becomes issue, increase fee
const newFee = new anchor.BN(5_000_000_000); // 5 XNT

await program.methods
  .updatePlatformConfig(null, null, newFee)
  .accounts({
    admin: adminWallet.publicKey,
    platformConfig: platformConfigPDA,
  })
  .rpc();

console.log("✅ Creation fee updated to 5 XNT");
```

### 3. Transfer Admin Authority
```javascript
// Transfer to new admin (e.g., multisig)
const newAdmin = new PublicKey("NEW_ADMIN_PUBKEY");

// First, update config with new admin
const config = await program.account.platformConfig.fetch(platformConfigPDA);
config.admin = newAdmin;

// Note: Requires program upgrade to add transfer_admin instruction
// OR redeploy with new admin
```

---

## 🚨 Emergency Procedures

### If Config Update Fails

1. **Check safety limits:**
```javascript
   const config = await program.account.platformConfig.fetch(platformConfigPDA);
   console.log("Min price:", config.minMintPrice.toNumber());
   console.log("Max price:", config.maxMintPrice.toNumber());
   
   // Your new price must be within these limits
```

2. **Verify admin authority:**
```javascript
   const config = await program.account.platformConfig.fetch(platformConfigPDA);
   console.log("Admin:", config.admin.toString());
   console.log("Your wallet:", wallet.publicKey.toString());
   
   // Must match!
```

3. **Check transaction logs:**
```bash
   solana confirm -v <SIGNATURE>
```

### If Wrong Values Set
```javascript
// Immediately update to correct values
await program.methods
  .updatePlatformConfig(
    correctMintPrice,
    correctTargetXnt,
    null
  )
  .accounts({...})
  .rpc();
```

---

## 📈 Recommended Update Schedule

### Monitor XNT Price Daily
```javascript
// Check XNT/USD price
const xntPrice = await getXNTPrice(); // From XDEX API

const currentConfig = await program.account.platformConfig.fetch(configPDA);
const currentMintPrice = currentConfig.mintPrice.toNumber();
const expectedMintPrice = Math.floor(14_040 / xntPrice);

const deviation = Math.abs(currentMintPrice - expectedMintPrice) / expectedMintPrice;

if (deviation > 0.1) { // >10% deviation
  console.log("⚠️ Price adjustment needed!");
  console.log(`Current: ${currentMintPrice}, Expected: ${expectedMintPrice}`);
  // Update config
}
```

### Update Thresholds

**Update when:**
- XNT price changes >10%
- $11,232 target would deviate >10%
- Significant market volatility

**Don't update when:**
- Minor price fluctuations (<5%)
- Temporary spikes
- Within 24 hours of last update

---

## ✅ Verification Checklist

After initialization:
- [ ] Platform config PDA exists
- [ ] Admin is correct wallet/multisig
- [ ] Mint price is reasonable
- [ ] Target XNT maintains ~$11,232
- [ ] Safety limits are set
- [ ] Config change logged

After updates:
- [ ] New values within safety limits
- [ ] Math correct (maintains USD target)
- [ ] Transaction confirmed
- [ ] Change documented
- [ ] Team notified

---

## 🔗 Useful Resources

- Program ID: `2NWX2Tn5ywkAEUiHxPm5Y28vQAghrDzHcMe78fv2NYye`
- X1 RPC: `https://rpc.mainnet.x1.xyz`
- XDEX API: `https://api.xdex.xyz`
- Explorer: `https://explorer.x1.xyz`

---

## 📞 Support

For admin support:
- GitHub Issues: https://github.com/omenpotter/fair-launch-program
- Documentation: /docs

---

**Platform Config PDA:** Deterministic at `["platform_config"]`  
**Admin Authority:** Must sign all config updates  
**Safety First:** Always test on devnet, use multisig, document changes
