import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { FairLaunchProgram } from "./target/types/fair_launch_program";
import { PublicKey } from "@solana/web3.js";
import fs from "fs";

async function revertToProduction() {
  console.log("🔄 Reverting Platform Config to PRODUCTION MODE\n");

  const connection = new anchor.web3.Connection(
    "https://rpc.mainnet.x1.xyz",
    "confirmed"
  );

  const adminKeypair = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(
        fs.readFileSync("/home/projectsx1/.config/solana/mainnet-wallet.json", "utf8")
      )
    )
  );

  const wallet = new anchor.Wallet(adminKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  const programId = new PublicKey("2NWX2Tn5ywkAEUiHxPm5Y28vQAghrDzHcMe78fv2NYye");
  const idl = JSON.parse(
    fs.readFileSync("./target/idl/fair_launch_program.json", "utf8")
  );
  const program = new Program(idl, programId, provider) as Program<FairLaunchProgram>;

  const platformConfigPDA = new PublicKey(
    "FLPTXGZkfcYzdLSFdxtjx1XKatvxbAx4VxnnLTdwc2jX"
  );

  console.log("Admin Wallet:", adminKeypair.publicKey.toString());
  console.log("Platform Config:", platformConfigPDA.toString());

  // PRODUCTION VALUES
  const PROD_MINT_PRICE = 14_040;
  const PROD_TARGET_XNT = new anchor.BN(11_232_000_000_000);

  console.log("📊 Production Values:");
  console.log("  Mint Price: 0.00001404 XNT per token");
  console.log("  Target XNT: 11,232 XNT total\n");

  try {
    console.log("📡 Sending transaction...");

    const tx = await program.methods
      .updatePlatformConfig(PROD_MINT_PRICE, PROD_TARGET_XNT, null)
      .accounts({
        admin: adminKeypair.publicKey,
        platformConfig: platformConfigPDA,
      })
      .rpc();

    console.log("✅ SUCCESS! Reverted to PRODUCTION MODE");
    console.log("Transaction:", tx);
    console.log("Explorer:", `https://explorer.mainnet.x1.xyz/tx/${tx}`);
    console.log();
    console.log("🚀 Ready for public launch!");
  } catch (error) {
    console.error("❌ Revert failed:", error);
  }
}

revertToProduction();
