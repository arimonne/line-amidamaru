import cron from 'node-cron';

let cronJob: any = null;

export function initializeCronJobs() {
  if (cronJob) return;

  cronJob = cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Phase 2 job triggered at', new Date().toISOString());

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/phase2/generate-amida`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        console.error('[Cron] Phase 2 job failed:', response.statusText);
      } else {
        const data = await response.json();
        console.log('[Cron] Phase 2 job completed:', data);
      }
    } catch (error) {
      console.error('[Cron] Phase 2 job error:', error);
    }
  });

  console.log('[Cron] Jobs initialized');
}

export function stopCronJobs() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('[Cron] Jobs stopped');
  }
}
