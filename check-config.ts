import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";

const RPC = "https://rpc.mainnet.x1.xyz";
const PLATFORM_CONFIG_PDA = new PublicKey("FLPTXGZkfcYzdLSFdxtjx1XKatvxbAx4VxnnLTdwc2jX");
const PROGRAM_ID = new PublicKey("2NWX2Tn5ywkAEUiHxPm5Y28vQAghrDzHcMe78fv2NYye");

async function checkConfig() {
  const connection = new Connection(RPC, "confirmed");
  
  // Fetch the account
  const accountInfo = await connection.getAccountInfo(PLATFORM_CONFIG_PDA);
  
  if (!accountInfo) {
    console.log("❌ Platform config not found!");
    return;
  }

  // Read the data (simplified parsing)
  const data = accountInfo.data;
  
  // PlatformConfig layout:
  // 0-32: admin (32 bytes)
  // 32-40: mint_price (8 bytes, u64)
  // 40-48: target_xnt (8 bytes, u64)
  
  const mintPriceLamports = data.readBigUInt64LE(32);
  const targetXntLamports = data.readBigUInt64LE(40);
  
  console.log("📊 ON-CHAIN PLATFORM CONFIG:");
  console.log("  mint_price:", mintPriceLamports.toString(), "lamports");
  console.log("  mint_price:", Number(mintPriceLamports) / 1e9, "XNT");
  console.log("  target_xnt:", targetXntLamports.toString(), "lamports");
  console.log("  target_xnt:", Number(targetXntLamports) / 1e9, "XNT");
  
  console.log("\n🧮 CALCULATION FOR 1,000,000 TOKENS:");
  const cost = Number(mintPriceLamports) * 1_000_000;
  console.log("  Cost:", cost, "lamports");
  console.log("  Cost:", cost / 1e9, "XNT");
}

checkConfig();
