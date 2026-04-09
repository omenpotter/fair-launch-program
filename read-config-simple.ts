import { Connection, PublicKey } from "@solana/web3.js";
import * as borsh from "@coral-xyz/borsh";

const RPC = "https://rpc.mainnet.x1.xyz";
const PLATFORM_CONFIG_PDA = new PublicKey("FLPTXGZkfcYzdLSFdxtjx1XKatvxbAx4VxnnLTdwc2jX");

// Define the PlatformConfig struct layout
const platformConfigSchema = borsh.struct([
  borsh.publicKey('admin'),
  borsh.u64('mintPrice'),
  borsh.u64('targetXnt'),
  borsh.u64('creationFee'),
  borsh.u64('minMintPrice'),
  borsh.u64('maxMintPrice'),
  borsh.u64('minTargetXnt'),
  borsh.u64('maxTargetXnt'),
  borsh.u64('minCreationFee'),
  borsh.u64('maxCreationFee'),
  borsh.u8('bump'),
]);

async function readConfig() {
  console.log("🔍 Reading On-Chain Platform Config\n");

  const connection = new Connection(RPC, "confirmed");
  
  try {
    const accountInfo = await connection.getAccountInfo(PLATFORM_CONFIG_PDA);
    
    if (!accountInfo) {
      console.log("❌ Platform config not found!");
      return;
    }

    // Skip 8-byte discriminator
    const data = accountInfo.data.slice(8);
    
    // Decode the struct
    const config = platformConfigSchema.decode(data);

    console.log("📊 ON-CHAIN PLATFORM CONFIG:");
    console.log("═══════════════════════════════════════");
    console.log("Admin:", config.admin.toString());
    
    console.log("\n💰 PRICING:");
    console.log("  mint_price:", config.mintPrice.toString(), "lamports");
    console.log("  mint_price:", Number(config.mintPrice) / 1e9, "XNT per token");
    console.log("  target_xnt:", config.targetXnt.toString(), "lamports");
    console.log("  target_xnt:", Number(config.targetXnt) / 1e9, "XNT total");
    console.log("  creation_fee:", config.creationFee.toString(), "lamports");
    console.log("  creation_fee:", Number(config.creationFee) / 1e9, "XNT");

    console.log("\n🛡️ SAFETY LIMITS:");
    console.log("  min_mint_price:", config.minMintPrice.toString(), "lamports");
    console.log("  min_mint_price:", Number(config.minMintPrice) / 1e9, "XNT");
    console.log("  max_mint_price:", config.maxMintPrice.toString(), "lamports");
    console.log("  max_mint_price:", Number(config.maxMintPrice) / 1e9, "XNT");
    console.log("  min_target_xnt:", config.minTargetXnt.toString(), "lamports");
    console.log("  min_target_xnt:", Number(config.minTargetXnt) / 1e9, "XNT");
    console.log("  max_target_xnt:", config.maxTargetXnt.toString(), "lamports");
    console.log("  max_target_xnt:", Number(config.maxTargetXnt) / 1e9, "XNT");

    console.log("\n🧮 CALCULATION FOR 1,000,000 TOKENS:");
    const tokensToMint = 1_000_000;
    const costLamports = Number(config.mintPrice) * tokensToMint;
    const costXNT = costLamports / 1e9;
    console.log("  Amount:", tokensToMint.toLocaleString(), "tokens");
    console.log("  Cost:", costLamports.toLocaleString(), "lamports");
    console.log("  Cost:", costXNT.toFixed(6), "XNT");

    console.log("\n✅ VERIFICATION:");
    console.log("  Does 800M tokens × mint_price = target_xnt?");
    const calculatedTarget = (Number(config.mintPrice) * 800_000_000) / 1e9;
    const actualTarget = Number(config.targetXnt) / 1e9;
    console.log("  Calculated:", calculatedTarget.toFixed(2), "XNT");
    console.log("  Actual:", actualTarget.toFixed(2), "XNT");
    console.log("  Match:", Math.abs(calculatedTarget - actualTarget) < 0.01 ? "✅ YES" : "❌ NO");

    console.log("\n🔍 DIAGNOSIS:");
    const errorNeeds = 1_250_000_000; // From your error message
    const errorCostPerToken = errorNeeds / 1_000_000;
    console.log("  Error said needs:", errorNeeds, "lamports =", errorNeeds / 1e9, "XNT");
    console.log("  Error cost per token:", errorCostPerToken, "lamports =", errorCostPerToken / 1e9, "XNT");
    console.log("  Config mint_price:", config.mintPrice.toString(), "lamports");
    console.log("  Match:", Number(config.mintPrice) === errorCostPerToken ? "✅ YES - Config matches error" : "❌ NO - Mismatch!");

  } catch (error) {
    console.error("❌ Error reading config:", error);
  }
}

readConfig();
