import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { readFileSync } from "fs";

async function updateToTestMode() {
  console.log("🔧 Updating Platform Config to TEST MODE\n");

  // Setup connection
  const connection = new anchor.web3.Connection("https://rpc.mainnet.x1.xyz", "confirmed");
  
  // Load admin keypair
  const adminKeypair = Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(readFileSync("/home/projectsx1/.config/solana/mainnet-wallet.json", "utf-8"))
    )
  );

  console.log("Admin Wallet:", adminKeypair.publicKey.toString());

  // Check balance
  const balance = await connection.getBalance(adminKeypair.publicKey);
  console.log("Admin Balance:", (balance / 1e9).toFixed(4), "XNT\n");

  // Setup wallet and provider
  const wallet = new anchor.Wallet(adminKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });

  // Load IDL
  const idl = JSON.parse(readFileSync("./target/idl/fair_launch_program.json", "utf-8"));

  // Create program interface
  const program = new anchor.Program(idl, provider);

  // Platform config PDA
  const platformConfigPda = new PublicKey("FLPTXGZkfcYzdLSFdxtjx1XKatvxbAx4VxnnLTdwc2jX");

  // CRITICAL: Use BN from anchor.BN constructor
  const BN = anchor.BN;
  
  // TEST VALUES - wrapped in BN
  const NEW_MINT_PRICE = new BN(12_500);          
  const NEW_TARGET_XNT = new BN(10_000_000_000);  
  const NEW_CREATION_FEE = null;

  console.log("📊 New Values:");
  console.log("  Mint Price:", NEW_MINT_PRICE.toString(), "(0.0000000125 XNT per token)");
  console.log("  Target XNT:", NEW_TARGET_XNT.toString(), "lamports (10 XNT)");
  console.log("  Creation Fee: null (unchanged)");
  console.log("  Calculation: 800M tokens × 0.0000000125 = 10 XNT ✅\n");

  try {
    console.log("📡 Sending transaction...");

    const tx = await program.methods
      .updatePlatformConfig(
        NEW_MINT_PRICE,
        NEW_TARGET_XNT,
        NEW_CREATION_FEE
      )
      .accounts({
        admin: adminKeypair.publicKey,
        platformConfig: platformConfigPda,
      })
      .rpc();

    console.log("✅ SUCCESS! Config updated to TEST MODE");
    console.log("Transaction:", tx);
    console.log("Explorer:", `https://explorer.mainnet.x1.xyz/tx/${tx}`);
    console.log("\n🎯 Test Configuration Active:");
    console.log("  • Create token: 1 XNT");
    console.log("  • Mint to 100%: 10 XNT");
    console.log("  • Total cost: 11 XNT (instead of 11,233 XNT!)");
    console.log("\n⚠️  REMEMBER: Run revert script before public launch!");

  } catch (error: any) {
    console.error("❌ Update failed:", error.message || error);
    
    if (error.logs) {
      console.log("\n📋 Program Logs:");
      error.logs.forEach((log: string) => console.log("  ", log));
    }
  }
}

updateToTestMode();
