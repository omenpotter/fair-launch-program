import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import fs from 'fs';

const RPC = 'https://rpc.mainnet.x1.xyz';
const PLATFORM_CONFIG_PDA = new PublicKey('FLPTXGZkfcYzdLSFdxtjx1XKatvxbAx4VxnnLTdwc2jX');
const PROGRAM_ID = new PublicKey('2NWX2Tn5ywkAEUiHxPm5Y28vQAghrDzHcMe78fv2NYye');

async function updateSafetyLimits() {
  console.log('🔧 STEP 1: Updating Safety Limits\n');

  const adminKeypair = Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(fs.readFileSync('/home/projectsx1/.config/solana/mainnet-wallet.json', 'utf-8'))
    )
  );

  const connection = new Connection(RPC, 'confirmed');
  const wallet = new anchor.Wallet(adminKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });

  const idl = JSON.parse(
    fs.readFileSync('./target/idl/fair_launch_program.json', 'utf8')
  );

  const program = new Program(idl, provider);

  console.log('Admin:', adminKeypair.publicKey.toString());
  console.log('Setting min_mint_price to: 0 lamports (allow free minting)\n');

  try {
    const tx = await program.methods
      .updateSafetyLimits(
        null,
        null,
        new BN(0),  // min_mint_price as BN
        null
      )
      .accounts({
        admin: adminKeypair.publicKey,
        platformConfig: PLATFORM_CONFIG_PDA,
      })
      .rpc();

    console.log('✅ SUCCESS! Safety limits updated');
    console.log('Transaction:', tx);
    console.log('Explorer: https://explorer.mainnet.x1.xyz/tx/' + tx);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.logs) {
      console.error('Program logs:', error.logs);
    }
  }
}

updateSafetyLimits();