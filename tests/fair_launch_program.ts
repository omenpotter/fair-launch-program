import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { FairLaunchProgram } from "../target/types/fair_launch_program";
import { 
  createMint, 
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID 
} from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";

describe("fair_launch_program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.FairLaunchProgram as Program<FairLaunchProgram>;
  
  let platformConfigPDA: anchor.web3.PublicKey;
  let platformConfigBump: number;
  
  let xntMint: anchor.web3.PublicKey;
  let adminXntAccount: anchor.web3.PublicKey;
  let escrowXntAccount: anchor.web3.PublicKey;
  
  const admin = provider.wallet as anchor.Wallet;
  
  before(async () => {
    console.log("Admin pubkey:", admin.publicKey.toString());
    
    // Derive platform config PDA
    [platformConfigPDA, platformConfigBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("platform_config")],
      program.programId
    );
    
    console.log("Platform Config PDA:", platformConfigPDA.toString());
  });

  it("Initializes platform config", async () => {
    try {
      const tx = await program.methods
        .initializePlatformConfig()
        .accounts({
          admin: admin.publicKey,
          platformConfig: platformConfigPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("✅ Platform config initialized");
      console.log("Transaction signature:", tx);

      // Fetch and verify config
      const config = await program.account.platformConfig.fetch(platformConfigPDA);
      
      assert.equal(config.admin.toString(), admin.publicKey.toString());
      assert.equal(config.mintPrice.toNumber(), 14_040);
      assert.equal(config.targetXnt.toString(), "11232000000000");
      assert.equal(config.creationFee.toString(), "1000000000");
      
      console.log("Config details:");
      console.log("  Admin:", config.admin.toString());
      console.log("  Mint price:", config.mintPrice.toNumber(), "lamports");
      console.log("  Target XNT:", config.targetXnt.toString(), "lamports");
      console.log("  Creation fee:", config.creationFee.toString(), "lamports");
      
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });

  it("Updates platform config", async () => {
    // New values (simulate XNT price increase to $10)
    const newMintPrice = new anchor.BN(1_404); // 10x lower
    const newTargetXnt = new anchor.BN(1_123_200_000_000); // 10x lower
    
    const tx = await program.methods
      .updatePlatformConfig(newMintPrice, newTargetXnt, null)
      .accounts({
        admin: admin.publicKey,
        platformConfig: platformConfigPDA,
      })
      .rpc();

    console.log("✅ Platform config updated");
    console.log("Transaction signature:", tx);

    // Verify update
    const config = await program.account.platformConfig.fetch(platformConfigPDA);
    assert.equal(config.mintPrice.toNumber(), 1_404);
    assert.equal(config.targetXnt.toString(), "1123200000000");
    
    console.log("Updated config:");
    console.log("  New mint price:", config.mintPrice.toNumber());
    console.log("  New target XNT:", config.targetXnt.toString());
  });

  it("Creates a fair launch token", async () => {
    // Create token mint keypair
    const tokenMint = Keypair.generate();
    
    // Derive fair launch PDA
    const [fairLaunchPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("fair_launch"), tokenMint.publicKey.toBuffer()],
      program.programId
    );
    
    const name = "Test Token";
    const symbol = "TEST";
    const maxPerWallet = new anchor.BN(10_000);
    
    const tx = await program.methods
      .initialize(name, symbol, maxPerWallet)
      .accounts({
        authority: admin.publicKey,
        platformConfig: platformConfigPDA,
        fairLaunch: fairLaunchPDA,
        tokenMint: tokenMint.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([tokenMint])
      .rpc();

    console.log("✅ Fair launch token created");
    console.log("Transaction signature:", tx);
    console.log("Token mint:", tokenMint.publicKey.toString());
    
    // Fetch and verify
    const fairLaunch = await program.account.fairLaunch.fetch(fairLaunchPDA);
    
    assert.equal(fairLaunch.name, name);
    assert.equal(fairLaunch.symbol, symbol);
    assert.equal(fairLaunch.totalSupply.toNumber(), 1_000_000_000);
    assert.equal(fairLaunch.publicSupply.toNumber(), 800_000_000);
    assert.equal(fairLaunch.liquiditySupply.toNumber(), 150_000_000);
    assert.equal(fairLaunch.platformSupply.toNumber(), 30_000_000);
    assert.equal(fairLaunch.burnSupply.toNumber(), 20_000_000);
    assert.equal(fairLaunch.creatorXntPercent, 5);
    assert.equal(fairLaunch.platformXntPercent, 3);
    assert.equal(fairLaunch.poolXntPercent, 92);
    
    console.log("Fair launch details:");
    console.log("  Name:", fairLaunch.name);
    console.log("  Symbol:", fairLaunch.symbol);
    console.log("  Total supply:", fairLaunch.totalSupply.toNumber());
    console.log("  Public supply:", fairLaunch.publicSupply.toNumber());
    console.log("  Liquidity supply:", fairLaunch.liquiditySupply.toNumber());
    console.log("  Platform supply:", fairLaunch.platformSupply.toNumber());
    console.log("  Burn supply:", fairLaunch.burnSupply.toNumber());
  });

  it("Verifies safety limits on config updates", async () => {
    // Try to set price outside range (should fail)
    const tooHighPrice = new anchor.BN(1_000_000); // Way above max
    
    try {
      await program.methods
        .updatePlatformConfig(tooHighPrice, null, null)
        .accounts({
          admin: admin.publicKey,
          platformConfig: platformConfigPDA,
        })
        .rpc();
      
      assert.fail("Should have failed with price out of range");
    } catch (error) {
      console.log("✅ Safety limit working - rejected out of range price");
      assert.include(error.toString(), "PriceOutOfRange");
    }
  });
});
