import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import fs from "fs";

const RPC = "https://rpc.mainnet.x1.xyz";
const PLATFORM_CONFIG_PDA = new PublicKey("FLPTXGZkfcYzdLSFdxtjx1XKatvxbAx4VxnnLTdwc2jX");

async function fixMintPrice() {
  console.log("🔧 Fixing mint_price to correct value\n");

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

  const program = anchor.workspace.FairLaunchProgram as Program;

  // CORRECT VALUE: 12,500 lamports = 0.0000000125 XNT
  const CORRECT_MINT_PRICE = 12_500;

  console.log("Setting mint_price to:", CORRECT_MINT_PRICE, "lamports");
  console.log("Which equals:", CORRECT_MINT_PRICE / 1e9, "XNT per token\n");

  try {
    const tx = await program.methods
      .updatePlatformConfig(CORRECT_MINT_PRICE, null, null)
      .accounts({
        admin: adminKeypair.publicKey,
        platformConfig: PLATFORM_CONFIG_PDA,
      })
      .rpc();

    console.log("✅ SUCCESS! mint_price updated");
    console.log("Transaction:", tx);
    console.log("\n🧮 Verification:");
    console.log("  1,000,000 tokens × 12,500 lamports = 12,500,000,000 lamports");
    console.log("  = 12.5 XNT");
  } catch (error) {
    console.error("❌ Update failed:", error);
  }
}

fixMintPrice();
