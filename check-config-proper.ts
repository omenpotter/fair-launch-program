import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import fs from "fs";

const RPC = "https://rpc.mainnet.x1.xyz";
const PLATFORM_CONFIG_PDA = new PublicKey("FLPTXGZkfcYzdLSFdxtjx1XKatvxbAx4VxnnLTdwc2jX");
const PROGRAM_ID = new PublicKey("2NWX2Tn5ywkAEUiHxPm5Y28vQAghrDzHcMe78fv2NYye");

async function checkConfig() {
  console.log("🔍 Reading On-Chain Platform Config\n");

  // Load admin keypair for provider
  const adminKeypair = Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(fs.readFileSync("/home/projectsx1/.config/solana/mainnet-wallet.json", "utf-8"))
    )
  );

  const connection = new Connection(RPC, "confirmed");
  const wallet = new anchor.Wallet(adminKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  // Load program
  const program = anchor.workspace.FairLaunchProgram as Program;

  try {
    // Fetch using Anchor's account fetcher
    const config = await program.account.platformConfig.fetch(PLATFORM_CONFIG_PDA);

    console.log("📊 ON-CHAIN PLATFORM CONFIG:");
    console.log("═══════════════════════════════════════");
    console.log("Admin:", config.admin.toString());
    console.log("\n💰 PRICING:");
    console.log("  mint_price:", config.mintPrice.toString(), "lamports");
    console.log("  mint_price:", config.mintPrice.toNumber() / 1e9, "XNT per token");
    console.log("  target_xnt:", config.targetXnt.toString(), "lamports");
    console.log("  target_xnt:", config.targetXnt.toNumber() / 1e9, "XNT total");
    console.log("  creation_fee:", config.creationFee.toString(), "lamports");
    console.log("  creation_fee:", config.creationFee.toNumber() / 1e9, "XNT");

    console.log("\n🛡️ SAFETY LIMITS:");
    console.log("  min_mint_price:", config.minMintPrice.toString(), "lamports");
    console.log("  max_mint_price:", config.maxMintPrice.toString(), "lamports");
    console.log("  min_target_xnt:", config.minTargetXnt.toString(), "lamports");
    console.log("  max_target_xnt:", config.maxTargetXnt.toString(), "lamports");

    console.log("\n🧮 CALCULATION FOR 1,000,000 TOKENS:");
    const tokensToMint = 1_000_000;
    const costLamports = config.mintPrice.toNumber() * tokensToMint;
    const costXNT = costLamports / 1e9;
    console.log("  Amount:", tokensToMint.toLocaleString(), "tokens");
    console.log("  Cost:", costLamports.toLocaleString(), "lamports");
    console.log("  Cost:", costXNT.toFixed(6), "XNT");

    console.log("\n✅ VERIFICATION:");
    console.log("  800M tokens × mint_price = target_xnt?");
    const calculatedTarget = (config.mintPrice.toNumber() * 800_000_000) / 1e9;
    const actualTarget = config.targetXnt.toNumber() / 1e9;
    console.log("  Calculated:", calculatedTarget.toFixed(2), "XNT");
    console.log("  Actual:", actualTarget.toFixed(2), "XNT");
    console.log("  Match:", Math.abs(calculatedTarget - actualTarget) < 0.01 ? "✅ YES" : "❌ NO");

  } catch (error) {
    console.error("❌ Error reading config:", error);
  }
}

checkConfig();
