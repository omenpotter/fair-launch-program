import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { FairLaunchProgram } from "./target/types/fair_launch_program";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import fs from "fs";

const RPC = "https://rpc.mainnet.x1.xyz";
const PLATFORM_CONFIG_PDA = new PublicKey("FLPTXGZkfcYzdLSFdxtjx1XKatvxbAx4VxnnLTdwc2jX");

async function updateToTestMode() {
  console.log("🔧 Updating Platform Config to TEST MODE\n");

  // Load admin keypair
  const adminKeypair = Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(fs.readFileSync("/home/projectsx1/.config/solana/mainnet-wallet.json", "utf-8"))
    )
  );

  console.log("Admin Wallet:", adminKeypair.publicKey.toString());
  console.log("Platform Config:", PLATFORM_CONFIG_PDA.toString());

  // Setup connection
  const connection = new Connection(RPC, "confirmed");
  
  // Check balance
  const balance = await connection.getBalance(adminKeypair.publicKey);
  console.log("Admin Balance:", (balance / 1e9).toFixed(4), "XNT\n");

  // Setup provider
  const wallet = new anchor.Wallet(adminKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  // Load program
  const programId = new PublicKey("2NWX2Tn5ywkAEUiHxPm5Y28vQAghrDzHcMe78fv2NYye");
  const program = anchor.workspace.FairLaunchProgram as Program<FairLaunchProgram>;

  // TEST VALUES
  const TEST_MINT_PRICE = 12_500; // 0.0000000125 XNT
  const TEST_TARGET_XNT = new anchor.BN(10_000_000_000); // 10 XNT

  console.log("📊 New Values:");
  console.log("  Mint Price: 0.0000000125 XNT per token");
  console.log("  Target XNT: 10 XNT total");
  console.log("  Calculation: 800M tokens × 0.0000000125 = 10 XNT ✅\n");

  try {
    console.log("📡 Sending transaction...");

    const tx = await program.methods
      .updatePlatformConfig(TEST_MINT_PRICE, TEST_TARGET_XNT, null)
      .accounts({
        admin: adminKeypair.publicKey,
        platformConfig: PLATFORM_CONFIG_PDA,
      })
      .rpc();

    console.log("✅ SUCCESS! Config updated to TEST MODE");
    console.log("Transaction:", tx);
    console.log("Explorer:", `https://explorer.mainnet.x1.xyz/tx/${tx}`);
    console.log("\n🎯 Test Configuration Active:");
    console.log("  • Create token: 1 XNT");
    console.log("  • Mint to 100%: 10 XNT");
    console.log("  • Total cost: 11 XNT (instead of 11,233 XNT!)");
  } catch (error) {
    console.error("❌ Update failed:", error);
  }
}

updateToTestMode();
