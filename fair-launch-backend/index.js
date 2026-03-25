import { EventListener } from './event-listener.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   Fair Launch Backend Service                  ║');
  console.log('║   Auto XDEX Pool Creation                      ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');

  const listener = new EventListener();

  process.on('SIGINT', async () => {
    console.log('\n\n👋 Shutting down...');
    await listener.stop();
    process.exit(0);
  });

  try {
    await listener.start();
    
    console.log('🟢 Backend service is running');
    console.log('Press Ctrl+C to stop\n');
    
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
