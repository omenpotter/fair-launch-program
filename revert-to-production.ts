import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { readFileSync } from "fs";

async function revertToProduction() {
  console.log("🔄 Reverting Platform Config to PRODUCTION MODE\n");

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
  
  // PRODUCTION VALUES
  const PROD_MINT_PRICE = new BN(14_040);              // 0.00001404 XNT
  const PROD_TARGET_XNT = new BN(11_232_000_000_000);  // 11,232 XNT

  console.log("📊 Production Values:");
  console.log("  Mint Price:", PROD_MINT_PRICE.toString(), "(0.00001404 XNT per token)");
  console.log("  Target XNT:", PROD_TARGET_XNT.toString(), "lamports (11,232 XNT)");
  console.log("  Calculation: 800M tokens × 0.00001404 = 11,232 XNT ✅\n");

  try {
    console.log("📡 Sending transaction...");

    const tx = await program.methods
      .updatePlatformConfig(PROD_MINT_PRICE, PROD_TARGET_XNT, null)
      .accounts({
        admin: adminKeypair.publicKey,
        platformConfig: platformConfigPda,
      })
      .rpc();

    console.log("✅ SUCCESS! Reverted to PRODUCTION MODE");
    console.log("Transaction:", tx);
    console.log("Explorer:", `https://explorer.mainnet.x1.xyz/tx/${tx}`);
    console.log("\n🚀 Production Configuration Active!");
    console.log("  • Mint to 100%: 11,232 XNT");
    console.log("  • Ready for public launch!");
    console.log("\n⚠️  Don't forget to update frontend config back to production values!");

  } catch (error: any) {
    console.error("❌ Revert failed:", error.message || error);
    if (error.logs) {
      console.log("\n📋 Program Logs:");
      error.logs.forEach((log: string) => console.log("  ", log));
    }
  }
}

revertToProduction();
```

---

## 🎊 **CONGRATULATIONS!**
```
╔════════════════════════════════════════════════════╗
║         YOU DID IT! 100% COMPLETE! 🎉              ║
╚════════════════════════════════════════════════════╝

✅ Smart contracts deployed
✅ Backend running 24/7
✅ Frontend integrated
✅ xDEX pool creation automated
✅ Test mode configured (10 XNT)
✅ Safety limits updated
✅ Ready to test!

🎯 NEXT STEP: Create your first test token!

Cost: Only 11 XNT total! 🚀
