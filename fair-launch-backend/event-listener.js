import { Connection, PublicKey } from '@solana/web3.js';
import dotenv from 'dotenv';

dotenv.config();

const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID);
const RPC_URL = process.env.SOLANA_RPC_URL;
const WS_URL = process.env.SOLANA_WS_URL;

class EventListener {
  constructor() {
    this.connection = new Connection(RPC_URL, {
      commitment: 'confirmed',
      wsEndpoint: WS_URL
    });
    this.subscriptionId = null;
  }

  async start() {
    console.log('🎧 Starting Fair Launch event listener...');
    console.log('Program ID:', PROGRAM_ID.toString());
    console.log('RPC:', RPC_URL);
    console.log('');

    try {
      this.subscriptionId = this.connection.onLogs(
        PROGRAM_ID,
        async (logs, context) => {
          await this.handleProgramLogs(logs, context);
        },
        'confirmed'
      );

      console.log('✅ Event listener started');
      console.log('Subscription ID:', this.subscriptionId);
      console.log('Listening for graduation events...\n');

    } catch (error) {
      console.error('❌ Failed to start listener:', error);
      throw error;
    }
  }

  async handleProgramLogs(logs, context) {
    try {
      console.log('\n📝 Program log detected');
      console.log('Signature:', logs.signature);
      console.log('Slot:', context.slot);
      console.log('Time:', new Date().toISOString());

      const tx = await this.connection.getTransaction(logs.signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });

      if (!tx || !tx.meta) {
        console.log('⚠️  Transaction not found');
        return;
      }

      const logMessages = tx.meta.logMessages || [];
      
      for (const log of logMessages) {
        if (log.includes('Token graduated') || log.includes('graduation')) {
          console.log('🎊 GRADUATION DETECTED!');
          console.log('Log:', log);
        }
        
        if (log.includes('Pool liquidity ready') || log.includes('PoolReadyEvent')) {
          console.log('💰 POOL READY EVENT!');
          console.log('Log:', log);
          
          const { createXDEXPool } = await import('./pool-creator.js');
          await createXDEXPool({ signature: logs.signature, logs: logMessages });
        }
      }

    } catch (error) {
      console.error('❌ Error handling logs:', error);
    }
  }

  async stop() {
    if (this.subscriptionId) {
      await this.connection.removeOnLogsListener(this.subscriptionId);
      console.log('👋 Event listener stopped');
    }
  }
}

export { EventListener };
