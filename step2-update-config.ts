import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import fs from 'fs';

const RPC = 'https://rpc.mainnet.x1.xyz';
const PLATFORM_CONFIG_PDA = new PublicKey('FLPTXGZkfcYzdLSFdxtjx1XKatvxbAx4VxnnLTdwc2jX');
const PROGRAM_ID = new PublicKey('2NWX2Tn5ywkAEUiHxPm5Y28vQAghrDzHcMe78fv2NYye');

async function updateConfig() {
  console.log('🔧 STEP 2: Updating Platform Config\n');

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

  // CORRECT VALUES FOR 10 XNT TARGET:
  // 10 XNT / 800M tokens = 12.5 lamports per token
  const CORRECT_MINT_PRICE = new BN(13); // 13 lamports (rounds up for safety)
  const TARGET_XNT = new BN(10_000_000_000); // 10 XNT

  console.log('📊 NEW ECONOMICS:');
  console.log('  mint_price: 13 lamports');
  console.log('  mint_price:', 13 / 1e9, 'XNT per token');
  console.log('  target_xnt: 10,000,000,000 lamports');
  console.log('  target_xnt: 10 XNT');
  
  console.log('\n🧮 VERIFICATION:');
  const totalCost = 800_000_000 * 13;
  console.log('  800M tokens × 13 lamports =', totalCost.toLocaleString(), 'lamports');
  console.log('  =', (totalCost / 1e9).toFixed(2), 'XNT');
  
  console.log('\n💰 COST EXAMPLES:');
  console.log('  1,000 tokens = 13,000 lamports = 0.000013 XNT');
  console.log('  10,000 tokens = 130,000 lamports = 0.00013 XNT');
  console.log('  100,000 tokens = 1,300,000 lamports = 0.0013 XNT');
  console.log('  1,000,000 tokens = 13,000,000 lamports = 0.013 XNT ✅');

  console.log('\n📡 Updating config...');

  try {
    const tx = await program.methods
      .updatePlatformConfig(CORRECT_MINT_PRICE, TARGET_XNT, null)
      .accounts({
        admin: adminKeypair.publicKey,
        platformConfig: PLATFORM_CONFIG_PDA,
      })
      .rpc();

    console.log('✅ SUCCESS! Config updated');
    console.log('Transaction:', tx);
    console.log('Explorer: https://explorer.mainnet.x1.xyz/tx/' + tx);
    
    console.log('\n🎯 NEW TOKEN ECONOMICS:');
    console.log('  ✅ Mint 1M tokens for 0.013 XNT');
    console.log('  ✅ Total to graduate: ~10.4 XNT');
    console.log('  ✅ Create fee: 1 XNT');
    console.log('  ✅ Grand total: ~11.4 XNT');
  } catch (error) {
    console.error('❌ Update failed:', error.message);
    if (error.logs) {
      console.error('Program logs:', error.logs);
    }
  }
}

updateConfig();