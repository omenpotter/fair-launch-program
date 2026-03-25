import { Connection, PublicKey, Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction,
  TOKEN_PROGRAM_ID 
} from '@solana/spl-token';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID);
const RPC_URL = process.env.SOLANA_RPC_URL;
const XNT_MINT = new PublicKey(process.env.XNT_MINT);
const INCINERATOR = new PublicKey('1nc1nerator11111111111111111111111111111111');

// TODO: Update these after XDEX team response
// import { createPool } from '@xdex/sdk';  // PENDING SDK
const XDEX_AMM_PROGRAM = null; // PENDING: xDEX AMM Program ID

/**
 * Main pool creation workflow
 * Triggered when PoolReadyEvent is detected
 */
async function createXDEXPool(eventData) {
  console.log('\n🏊 POOL CREATION WORKFLOW STARTED');
  console.log('═'.repeat(60));
  console.log('Time:', new Date().toISOString());
  console.log('Event Signature:', eventData.signature);
  console.log('');

  // Load platform wallet
  const platformKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(process.env.PLATFORM_WALLET_PATH, 'utf-8')))
  );

  console.log('Platform Wallet:', platformKeypair.publicKey.toString());
  console.log('');

  try {
    // STEP 1: Parse graduation event data
    console.log('📊 STEP 1: Parsing graduation event...');
    const poolData = await parseGraduationEvent(eventData);
    
    if (!poolData) {
      throw new Error('Failed to parse pool data from event');
    }

    console.log('✅ Pool data extracted:');
    console.log('   Token Mint:', poolData.tokenMint);
    console.log('   Pool XNT:', (poolData.poolXnt / 1e9).toFixed(2), 'XNT');
    console.log('   Pool Tokens:', (poolData.poolTokens / 1e9).toFixed(0), 'M tokens');
    console.log('');

    // STEP 2: Create xDEX pool
    console.log('🔗 STEP 2: Creating xDEX pool...');
    const poolResult = await createPoolViaXDEX(poolData, platformKeypair);
    
    console.log('✅ xDEX pool created:');
    console.log('   Pool Address:', poolResult.poolAddress);
    console.log('   LP Mint:', poolResult.lpMint);
    console.log('   Transaction:', poolResult.signature);
    console.log('');

    // STEP 3: Burn LP tokens to incinerator
    console.log('🔥 STEP 3: Burning LP tokens...');
    const burnSignature = await burnLPTokens(platformKeypair, poolResult.lpMint, poolResult.lpAmount);
    
    console.log('✅ LP tokens burned:');
    console.log('   Amount:', (poolResult.lpAmount / 1e9).toFixed(2), 'LP');
    console.log('   Transaction:', burnSignature);
    console.log('   Sent to:', INCINERATOR.toString());
    console.log('');

    // STEP 4: Mark pool as created on Fair Launch program
    console.log('📝 STEP 4: Marking pool as created on-chain...');
    const markSignature = await markPoolCreated(
      platformKeypair, 
      poolData.tokenMint, 
      poolResult.poolAddress
    );
    
    console.log('✅ Pool marked as created:');
    console.log('   Transaction:', markSignature);
    console.log('');

    console.log('═'.repeat(60));
    console.log('🎉 POOL CREATION COMPLETE!');
    console.log('═'.repeat(60));
    console.log('');
    console.log('Summary:');
    console.log('  Token:', poolData.tokenMint);
    console.log('  Pool:', poolResult.poolAddress);
    console.log('  Status: LIVE ON XDEX');
    console.log('  Liquidity: PERMANENTLY LOCKED');
    console.log('');

    return {
      success: true,
      tokenMint: poolData.tokenMint,
      poolAddress: poolResult.poolAddress,
      lpMint: poolResult.lpMint,
      transactions: {
        poolCreation: poolResult.signature,
        lpBurn: burnSignature,
        markCreated: markSignature
      }
    };

  } catch (error) {
    console.error('\n❌ POOL CREATION FAILED');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('');

    // Schedule retry
    await scheduleRetry(eventData, 1);
    
    throw error;
  }
}

/**
 * Parse PoolReadyEvent from transaction logs
 */
async function parseGraduationEvent(eventData) {
  console.log('Parsing transaction logs...');
  
  const logs = eventData.logs || [];
  
  let tokenMint = null;
  let poolXnt = null;
  let poolTokens = null;
  
  for (const log of logs) {
    // Look for "Pool liquidity ready" message
    // Format: "Pool liquidity ready: {XNT} lamports XNT + {TOKENS} tokens"
    
    if (log.includes('Pool liquidity ready')) {
      // Extract XNT amount
      const xntMatch = log.match(/(\d+)\s+lamports\s+XNT/);
      if (xntMatch) {
        poolXnt = parseInt(xntMatch[1]);
        console.log('   Extracted XNT:', poolXnt);
      }
      
      // Extract token amount  
      const tokenMatch = log.match(/\+\s+(\d+)\s+tokens/);
      if (tokenMatch) {
        poolTokens = parseInt(tokenMatch[1]);
        console.log('   Extracted Tokens:', poolTokens);
      }
    }
  }
  
  // TODO: Extract token mint from transaction accounts
  // For now using placeholder - needs actual implementation
  
  if (!poolXnt || !poolTokens) {
    console.warn('⚠️  Could not parse amounts from logs');
    console.warn('Log sample:', logs.slice(0, 3));
    return null;
  }
  
  return {
    tokenMint: tokenMint || 'PLACEHOLDER_NEEDS_EXTRACTION',
    poolXnt,
    poolTokens
  };
}

/**
 * Create pool on xDEX
 * 
 * PENDING: xDEX SDK integration
 * Waiting for: SDK package, createPool method, parameters
 */
async function createPoolViaXDEX(poolData, platformKeypair) {
  console.log('Preparing xDEX pool creation...');
  
  const connection = new Connection(RPC_URL, 'confirmed');
  
  // ===== OPTION 1: Using xDEX SDK (PREFERRED) =====
  // Uncomment when SDK is available:
  
  /*
  try {
    const { createPool } = await import('@xdex/sdk');
    
    const result = await createPool({
      connection,
      wallet: platformKeypair,
      tokenA: new PublicKey(poolData.tokenMint),
      tokenB: XNT_MINT,
      amountA: BigInt(poolData.poolTokens),
      amountB: BigInt(poolData.poolXnt),
      feeTier: 0.003  // 0.3%
    });
    
    return {
      poolAddress: result.poolAddress.toString(),
      lpMint: result.lpMint.toString(),
      lpAmount: Number(result.lpAmount),
      signature: result.signature
    };
    
  } catch (error) {
    console.error('xDEX SDK error:', error);
    throw error;
  }
  */
  
  // ===== PLACEHOLDER (until SDK available) =====
  console.log('');
  console.log('⚠️  XDEX SDK NOT YET INTEGRATED');
  console.log('Waiting for xDEX team response with:');
  console.log('  - SDK package name');
  console.log('  - createPool method signature');
  console.log('  - Required parameters');
  console.log('');
  console.log('Pool would be created with:');
  console.log('  Token A:', poolData.tokenMint);
  console.log('  Token B:', XNT_MINT.toString());
  console.log('  Amount A:', poolData.poolTokens);
  console.log('  Amount B:', poolData.poolXnt);
  console.log('  Fee Tier: 0.3%');
  console.log('');
  
  // Return mock data for testing
  throw new Error('xDEX SDK integration pending - cannot create pool yet');
}

/**
 * Burn LP tokens by sending to incinerator address
 */
async function burnLPTokens(platformKeypair, lpMintAddress, lpAmount) {
  console.log('Preparing LP token burn...');
  console.log('   LP Mint:', lpMintAddress);
  console.log('   Amount:', lpAmount);
  
  const connection = new Connection(RPC_URL, 'confirmed');
  
  try {
    const lpMint = new PublicKey(lpMintAddress);
    
    // Get platform's LP token account
    const platformLPAccount = await getAssociatedTokenAddress(
      lpMint,
      platformKeypair.publicKey
    );
    
    console.log('   From ATA:', platformLPAccount.toString());
    
    // Get actual balance
    const balance = await connection.getTokenAccountBalance(platformLPAccount);
    const actualAmount = BigInt(balance.value.amount);
    
    console.log('   Balance:', actualAmount.toString());
    
    if (actualAmount === 0n) {
      throw new Error('No LP tokens in wallet - pool creation may have failed');
    }
    
    // Get incinerator's ATA (or create if needed)
    const incineratorLPAccount = await getAssociatedTokenAddress(
      lpMint,
      INCINERATOR
    );
    
    console.log('   To ATA:', incineratorLPAccount.toString());
    
    // Create transfer instruction
    const transferIx = createTransferInstruction(
      platformLPAccount,
      incineratorLPAccount,
      platformKeypair.publicKey,
      actualAmount,
      [],
      TOKEN_PROGRAM_ID
    );
    
    // Create and send transaction
    const tx = new Transaction().add(transferIx);
    
    const signature = await connection.sendTransaction(tx, [platformKeypair]);
    await connection.confirmTransaction(signature, 'confirmed');
    
    console.log('   Transfer complete!');
    
    return signature;
    
  } catch (error) {
    console.error('LP token burn failed:', error.message);
    throw error;
  }
}

/**
 * Mark pool as created on Fair Launch program
 */
async function markPoolCreated(platformKeypair, tokenMintStr, poolAddressStr) {
  console.log('Marking pool as created...');
  
  const connection = new Connection(RPC_URL, 'confirmed');
  
  try {
    // Load Fair Launch program IDL
    const idl = JSON.parse(fs.readFileSync('./fair_launch_program.json', 'utf-8'));
    
    const wallet = new Wallet(platformKeypair);
    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    const program = new Program(idl, provider);
    
    // Derive Fair Launch PDA
    const tokenMint = new PublicKey(tokenMintStr);
    const [fairLaunchPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('fair_launch'), tokenMint.toBuffer()],
      PROGRAM_ID
    );
    
    const poolAddress = new PublicKey(poolAddressStr);
    
    console.log('   Fair Launch PDA:', fairLaunchPDA.toString());
    console.log('   Pool Address:', poolAddress.toString());
    
    // Call mark_pool_created instruction
    const tx = await program.methods
      .markPoolCreated(poolAddress)
      .accounts({
        fairLaunch: fairLaunchPDA,
        platformAuthority: platformKeypair.publicKey,
      })
      .rpc();
    
    await connection.confirmTransaction(tx, 'confirmed');
    
    console.log('   Marked successfully!');
    
    return tx;
    
  } catch (error) {
    console.error('Failed to mark pool as created:', error.message);
    
    // This is not critical - pool is already created and LP burned
    console.warn('⚠️  Pool exists but not marked on-chain - manual fix needed');
    console.warn('Token:', tokenMintStr);
    console.warn('Pool:', poolAddressStr);
    
    return null;
  }
}

/**
 * Retry logic with exponential backoff
 */
async function scheduleRetry(eventData, attempt) {
  const maxAttempts = parseInt(process.env.RETRY_MAX_ATTEMPTS || '5');
  const initialDelay = parseInt(process.env.RETRY_INITIAL_DELAY_MS || '1000');
  
  if (attempt >= maxAttempts) {
    console.error('\n🚨 MAX RETRY ATTEMPTS REACHED');
    console.error('═'.repeat(60));
    console.error('MANUAL INTERVENTION REQUIRED!');
    console.error('');
    console.error('Event Details:');
    console.error(JSON.stringify(eventData, null, 2));
    console.error('');
    console.error('Action Required:');
    console.error('1. Check event logs above');
    console.error('2. Manually create pool on xDEX UI');
    console.error('3. Burn LP tokens to incinerator');
    console.error('4. Call mark_pool_created manually');
    console.error('═'.repeat(60));
    
    // TODO: Send alert
    // await sendAlert('Pool creation failed', eventData);
    
    return;
  }
  
  const delay = Math.min(initialDelay * Math.pow(2, attempt), 60000);
  
  console.log('');
  console.log('⏳ SCHEDULING RETRY');
  console.log(`   Attempt: ${attempt}/${maxAttempts}`);
  console.log(`   Delay: ${delay}ms`);
  console.log('');
  
  setTimeout(async () => {
    console.log(`\n🔄 RETRY ATTEMPT ${attempt}/${maxAttempts}`);
    console.log('═'.repeat(60));
    
    try {
      await createXDEXPool(eventData);
      console.log(`✅ Retry ${attempt} successful!`);
    } catch (error) {
      console.error(`❌ Retry ${attempt} failed:`, error.message);
      await scheduleRetry(eventData, attempt + 1);
    }
  }, delay);
}

export { createXDEXPool };
