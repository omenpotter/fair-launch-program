import { Connection, PublicKey } from '@solana/web3.js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID);
const RPC_URL = process.env.SOLANA_RPC_URL;

async function test() {
  console.log('🧪 Testing configuration...\n');

  const connection = new Connection(RPC_URL, 'confirmed');

  console.log('1️⃣  RPC connection...');
  try {
    const version = await connection.getVersion();
    console.log('✅ Connected');
    console.log('   RPC:', RPC_URL);
  } catch (error) {
    console.log('❌ Failed:', error.message);
    return;
  }

  console.log('\n2️⃣  Program...');
  try {
    const info = await connection.getAccountInfo(PROGRAM_ID);
    if (info) console.log('✅ Program found');
    else console.log('❌ Not found');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n3️⃣  Wallet...');
  try {
    if (fs.existsSync(process.env.PLATFORM_WALLET_PATH)) {
      console.log('✅ Wallet found');
    } else {
      console.log('❌ Not found');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n' + '═'.repeat(50));
  console.log('✅ Test complete!');
  console.log('═'.repeat(50) + '\n');
}

test().catch(console.error);
