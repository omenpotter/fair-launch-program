import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROGRAM_ID = new PublicKey("2NWX2Tn5ywkAEUiHxPm5Y28vQAghrDzHcMe78fv2NYye");
const RPC_URL = "https://rpc.mainnet.x1.xyz";

async function main() {
  console.log("🚀 Initializing Fair Launch Platform Config...\n");

  // Load IDL
  const idlPath = join(__dirname, "../target/idl/fair_launch_program.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

  // Load admin wallet
  const adminKeypairPath = process.env.ADMIN_WALLET_PATH || process.argv[2];
  if (!adminKeypairPath) {
    console.error("❌ Error: Admin wallet path required");
    console.log("Usage: node initialize-platform.js /path/to/admin-wallet.json");
    process.exit(1);
  }

  const adminKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(adminKeypairPath, "utf-8")))
  );

  console.log("Admin wallet:", adminKeypair.publicKey.toString());

  // Setup provider
  const connection = new Connection(RPC_URL, "confirmed");
  const wallet = new Wallet(adminKeypair);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  const program = new Program(idl, provider);

  // Derive platform config PDA
  const [platformConfigPDA, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("platform_config")],
    PROGRAM_ID
  );

  console.log("Platform Config PDA:", platformConfigPDA.toString());
  console.log("Bump:", bump);
  console.log("");

  // Check if already initialized
  try {
    const existing = await program.account.platformConfig.fetch(platformConfigPDA);
    console.log("⚠️  Platform config already initialized!");
    console.log("Current admin:", existing.admin.toString());
    console.log("Mint price:", existing.mintPrice.toNumber(), "lamports");
    console.log("Target XNT:", existing.targetXnt.toString(), "lamports");
    console.log("Creation fee:", existing.creationFee.toString(), "lamports");
    console.log("\n✅ Nothing to do. Platform is ready!");
    return;
  } catch (error) {
    console.log("✅ Platform config not initialized yet. Proceeding...\n");
  }

  // Check balance
  const balance = await connection.getBalance(adminKeypair.publicKey);
  console.log("Admin balance:", balance / 1e9, "SOL");

  if (balance < 0.1 * 1e9) {
    console.error("❌ Error: Insufficient balance. Need at least 0.1 SOL");
    process.exit(1);
  }

  // Initialize platform config
  console.log("📝 Initializing platform config...");

  try {
    const tx = await program.methods
      .initializePlatformConfig()
      .accounts({
        admin: adminKeypair.publicKey,
        platformConfig: platformConfigPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("\n✅ Platform config initialized successfully!");
    console.log("Transaction signature:", tx);
    console.log("");

    // Fetch and display config
    const config = await program.account.platformConfig.fetch(platformConfigPDA);

    console.log("📊 Platform Configuration:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Admin:           ", config.admin.toString());
    console.log("");
    console.log("Current Values:");
    console.log("  Mint Price:    ", config.mintPrice.toNumber(), "lamports (0.00001404 XNT)");
    console.log("  Target XNT:    ", config.targetXnt.toString(), "lamports (11,232 XNT)");
    console.log("  Creation Fee:  ", config.creationFee.toString(), "lamports (1 XNT)");
    console.log("");
    console.log("Safety Limits:");
    console.log("  Min Mint Price:", config.minMintPrice.toNumber(), "lamports");
    console.log("  Max Mint Price:", config.maxMintPrice.toNumber(), "lamports");
    console.log("  Min Target XNT:", config.minTargetXnt.toString(), "lamports");
    console.log("  Max Target XNT:", config.maxTargetXnt.toString(), "lamports");
    console.log("  Min Creation Fee:", config.minCreationFee.toString(), "lamports");
    console.log("  Max Creation Fee:", config.maxCreationFee.toString(), "lamports");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
    console.log("🎉 Fair Launch Platform is ready!");
    console.log("");

  } catch (error) {
    console.error("\n❌ Initialization failed:", error);
    if (error.logs) {
      console.error("Program logs:", error.logs);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
