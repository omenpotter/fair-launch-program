import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import fs from "fs";

describe("Update Config", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.FairLaunchProgram;

  it("Updates to test mode", async () => {
    const platformConfigPda = new PublicKey("FLPTXGZkfcYzdLSFdxtjx1XKatvxbAx4VxnnLTdwc2jX");
    
    // Load admin keypair
    const adminKeypair = Keypair.fromSecretKey(
      Uint8Array.from(
        JSON.parse(fs.readFileSync("/home/projectsx1/.config/solana/mainnet-wallet.json", "utf-8"))
      )
    );

    const TEST_MINT_PRICE = 12_500;
    const TEST_TARGET_XNT = new BN(10_000_000_000);

    console.log("Updating config...");
    
    const tx = await program.methods
      .updatePlatformConfig(TEST_MINT_PRICE, TEST_TARGET_XNT, null)
      .accounts({
        admin: adminKeypair.publicKey,
        platformConfig: platformConfigPda,
      })
      .signers([adminKeypair])
      .rpc();

    console.log("✅ Updated! TX:", tx);
  });
});
