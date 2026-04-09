// update-to-test-mode.js
import { Connection, PublicKey, Keypair, Transaction, TransactionInstruction } from '@solana/web3.js';
import { readFileSync } from 'fs';
import bs58 from 'bs58';

// Configuration
const RPC = 'https://rpc.mainnet.x1.xyz';
const PROGRAM_ID = new PublicKey('2NWX2Tn5ywkAEUiHxPm5Y28vQAghrDzHcMe78fv2NYye');
const PLATFORM_CONFIG_PDA = new PublicKey('FLPTXGZkfcYzdLSFdxtjx1XKatvxbAx4VxnnLTdwc2jX');
const ADMIN_KEYPAIR_PATH = '/home/projectsx1/.config/solana/mainnet-wallet.json';

// Instruction discriminator for update_platform_config
// This is the first 8 bytes of SHA256("global:update_platform_config")
const UPDATE_DISCRIMINATOR = Buffer.from([
  0x29, 0x4c, 0x71, 0xfd, 0x4f, 0x6e, 0x2e, 0x8a
]);

function serializeUpdateParams(mintPrice, targetXnt) {
  const buffer = Buffer.alloc(1 + 8 + 1 + 8 + 1);
  let offset = 0;
  
  // Option<u64> for mint_price (Some)
  buffer.writeUInt8(1, offset); offset += 1; // Some
  buffer.writeBigUInt64LE(BigInt(mintPrice), offset); offset += 8;
  
  // Option<u64> for target_xnt (Some)
  buffer.writeUInt8(1, offset); offset += 1; // Some
  buffer.writeBigUInt64LE(BigInt(targetXnt), offset); offset += 8;
  
  // Option<u64> for creation_fee (None)
  buffer.writeUInt8(0, offset); offset += 1; // None
  
  return buffer;
}

async function updateToTestMode() {
  console.log('🔧 Updating Platform Config to TEST MODE\n');
  
  try {
    const connection = new Connection(RPC, 'confirmed');
    const adminKeypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(readFileSync(ADMIN_KEYPAIR_PATH)))
    );
    
    console.log('Admin Wallet:', adminKeypair.publicKey.toString());
    console.log('Platform Config:', PLATFORM_CONFIG_PDA.toString());
    
    // Check balance
    const balance = await connection.getBalance(adminKeypair.publicKey);
    console.log('Admin Balance:', (balance / 1e9).toFixed(4), 'XNT\n');
    
    if (balance < 0.01 * 1e9) {
      console.error('❌ Insufficient balance! Need at least 0.01 XNT for transaction');
      return;
    }
    
    // TEST VALUES
    const TEST_MINT_PRICE = 12_500;  // 0.0000000125 XNT per token
    const TEST_TARGET_XNT = 10_000_000_000;  // 10 XNT in lamports
    
    console.log('📊 New Values:');
    console.log('  Mint Price: 0.0000000125 XNT per token');
    console.log('  Target XNT: 10 XNT total');
    console.log('  Calculation: 800M tokens × 0.0000000125 = 10 XNT ✅');
    console.log();
    
    // Serialize instruction data
    const instructionData = Buffer.concat([
      UPDATE_DISCRIMINATOR,
      serializeUpdateParams(TEST_MINT_PRICE, TEST_TARGET_XNT)
    ]);
    
    // Create instruction
    const instruction = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: adminKeypair.publicKey, isSigner: true, isWritable: false },
        { pubkey: PLATFORM_CONFIG_PDA, isSigner: false, isWritable: true },
      ],
      data: instructionData,
    });
    
    // Create and send transaction
    console.log('📡 Sending transaction...');
    
    const transaction = new Transaction().add(instruction);
    transaction.feePayer = adminKeypair.publicKey;
    
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    
    transaction.sign(adminKeypair);
    
    const signature = await connection.sendRawTransaction(transaction.serialize());
    
    console.log('⏳ Confirming transaction...');
    await connection.confirmTransaction(signature, 'confirmed');
    
    console.log('✅ SUCCESS! Config updated to TEST MODE');
    console.log('Transaction:', signature);
    console.log('Explorer:', `https://explorer.mainnet.x1.xyz/tx/${signature}`);
    console.log();
    console.log('🎯 Test Configuration Active:');
    console.log('  • Create token: 1 XNT');
    console.log('  • Mint to 100%: 10 XNT');
    console.log('  • Total cost: 11 XNT (instead of 11,233 XNT!)');
    console.log('  • Pool creates with 10 XNT liquidity');
    console.log();
    console.log('⚠️  REMEMBER: Run revert-to-production.js before public launch!');
    
  } catch (error) {
    console.error('❌ Update failed:', error);
    if (error.logs) {
      console.log('\nProgram Logs:');
      error.logs.forEach(log => console.log('  ', log));
    }
  }
}

updateToTestMode();
