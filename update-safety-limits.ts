import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { readFileSync } from "fs";

async function updateSafetyLimits() {
  console.log("🔧 Updating Safety Limits to Allow 10 XNT Minimum\n");

  const connection = new anchor.web3.Connection("https://rpc.mainnet.x1.xyz", "confirmed");
  
  const adminKeypair = Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(readFileSync("/home/projectsx1/.config/solana/mainnet-wallet.json", "utf-8"))
    )
  );

  console.log("Admin Wallet:", adminKeypair.publicKey.toString());

  const balance = await connection.getBalance(adminKeypair.publicKey);
  console.log("Admin Balance:", (balance / 1e9).toFixed(4), "XNT\n");

  const wallet = new anchor.Wallet(adminKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  
  const idl = JSON.parse(readFileSync("./target/idl/fair_launch_program.json", "utf-8"));
  const program = new anchor.Program(idl, provider);

  const platformConfigPda = new PublicKey("FLPTXGZkfcYzdLSFdxtjx1XKatvxbAx4VxnnLTdwc2jX");

  const BN = anchor.BN;
  
  // NEW SAFETY LIMITS
  const NEW_MIN_TARGET_XNT = new BN(10_000_000_000);      // 10 XNT (was 1,123.2)
  const NEW_MAX_TARGET_XNT = null;                         // Keep existing
  const NEW_MIN_MINT_PRICE = null;                         // Keep existing  
  const NEW_MAX_MINT_PRICE = null;                         // Keep existing

  console.log("📊 New Safety Limits:");
  console.log("  Min Target XNT:", NEW_MIN_TARGET_XNT.toString(), "lamports (10 XNT)");
  console.log("  Old Min Target: 1,123.2 XNT");
  console.log("  This allows testing with 10 XNT! ✅\n");

  try {
    console.log("📡 Sending transaction...");

    const tx = await program.methods
      .updateSafetyLimits(
        NEW_MIN_TARGET_XNT,
        NEW_MAX_TARGET_XNT,
        NEW_MIN_MINT_PRICE,
        NEW_MAX_MINT_PRICE
      )
      .accounts({
        admin: adminKeypair.publicKey,
        platformConfig: platformConfigPda,
      })
      .rpc();

    console.log("✅ SUCCESS! Safety limits updated");
    console.log("Transaction:", tx);
    console.log("Explorer:", `https://explorer.mainnet.x1.xyz/tx/${tx}`);
    console.log("\n🎯 New Limits Active:");
    console.log("  • Minimum target: 10 XNT (was 1,123.2 XNT)");
    console.log("  • You can now test with 10 XNT!");

  } catch (error: any) {
    console.error("❌ Update failed:", error.message || error);
    if (error.logs) {
      console.log("\n📋 Program Logs:");
      error.logs.forEach((log: string) => console.log("  ", log));
    }
  }
}

updateSafetyLimits();
