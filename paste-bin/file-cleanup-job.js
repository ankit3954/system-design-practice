const {nodeCron} = require("node-cron")
const { runExpiredFileCleanup } = require("./batch-cleanup")

let isRunning = false;

const initCleanupCron = () => {
  nodeCron.schedule(
    '0 2 * * *',
    async () => {
      if (isRunning) {
        console.warn('[Cleanup] Skipped — previous cleanup is still running.');
        return;
      }

      isRunning = true;
      const startTime = Date.now();
      console.log('[Cleanup] Job started...');

      try {
        const totalDeleted = await runExpiredFileCleanup();
        const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[Cleanup] Finished. Deleted ${totalDeleted} records in ${durationSec}s.`);
      } catch (error) {
        console.error('[Cleanup] Error during batch cleanup:', error);
      } finally {
        isRunning = false;
      }
    },
    {
      timezone: 'Asia/Kathmandu',
    }
  );
}


module.exports = {
    initCleanupCron
}
