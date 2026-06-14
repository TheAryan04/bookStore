import cron from "cron";
import https from "https";
import http from "http";
import { URL } from "url";

const job = new cron.CronJob("*/14 * * * *", () => {
    if (process.env.DISABLE_CRON === 'true') {
        console.log('[cron] Cron disabled via DISABLE_CRON=true');
        return;
    }

    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
        console.log('[cron] API_URL not set; skipping scheduled GET request.');
        return;
    }

    let parsed;
    try {
        parsed = new URL(apiUrl);
    } catch (err) {
        console.error('Invalid API_URL:', apiUrl);
        return;
    }

    const clientFor = (p) => (p === 'http:' ? http : https);
    const maxAttempts = parseInt(process.env.CRON_MAX_ATTEMPTS, 10) || 3;
    const requestTimeoutMs = parseInt(process.env.CRON_REQUEST_TIMEOUT_MS, 10) || 5000;
    const redirectLimit = parseInt(process.env.CRON_REDIRECT_LIMIT, 10) || 3;
    const baseDelayMs = 500;

    // prevent overlapping runs
    if (job._running) {
        console.log('[cron] Previous job still running; skipping this scheduled run.');
        return;
    }

    job._running = true;

    const isoNow = () => new Date().toISOString();

    const backoffDelay = (attempt) => {
        const expo = baseDelayMs * 2 ** (attempt - 1);
        const jitter = Math.floor(Math.random() * 300);
        return expo + jitter;
    };

    const doRequest = (url, attempt = 1, redirects = 0) => {
        const parsedUrl = new URL(url);
        const client = clientFor(parsedUrl.protocol);
        const start = Date.now();

        const req = client.get(url, (res) => {
            const { statusCode } = res;
            if (statusCode >= 200 && statusCode < 300) {
                console.log(`${isoNow()} [cron] GET ${url} succeeded (${statusCode}) in ${Date.now() - start}ms`);
                job._running = false;
            } else if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
                const location = res.headers.location;
                console.log(`${isoNow()} [cron] GET ${url} redirected to ${location} (status ${statusCode})`);
                if (redirects < redirectLimit) {
                    // follow redirect
                    setImmediate(() => doRequest(new URL(location, url).toString(), 1, redirects + 1));
                } else {
                    console.warn(`${isoNow()} [cron] Redirect limit reached for ${url}`);
                    job._running = false;
                }
            } else {
                console.warn(`${isoNow()} [cron] GET ${url} failed with status ${statusCode}`);
                // retry logic
                if (attempt < maxAttempts) {
                    const delay = backoffDelay(attempt);
                    console.log(`${isoNow()} [cron] Retrying ${url} in ${delay}ms (attempt ${attempt + 1})`);
                    setTimeout(() => doRequest(url, attempt + 1, redirects), delay);
                } else {
                    console.error(`${isoNow()} [cron] GET ${url} failed after ${attempt} attempts`);
                    job._running = false;
                }
            }

            res.on('data', () => {});
            res.on('end', () => {});
        });

        req.on('error', (e) => {
            console.error(`${isoNow()} [cron] Error making GET request to ${url} (attempt ${attempt}):`, e.message || e);
            if (attempt < maxAttempts) {
                const delay = backoffDelay(attempt);
                setTimeout(() => doRequest(url, attempt + 1, redirects), delay);
            } else {
                console.error(`${isoNow()} [cron] Request to ${url} failed after ${attempt} attempts`);
                job._running = false;
            }
        });

        req.setTimeout(requestTimeoutMs, () => {
            req.abort();
            console.error(`${isoNow()} [cron] GET ${url} timed out after ${requestTimeoutMs}ms (attempt ${attempt})`);
            if (attempt < maxAttempts) {
                const delay = backoffDelay(attempt);
                setTimeout(() => doRequest(url, attempt + 1, redirects), delay);
            } else {
                job._running = false;
            }
        });
    };

    try {
        doRequest(apiUrl);
    } catch (err) {
        console.error('[cron] Unhandled error in scheduled GET:', err);
        job._running = false;
    }
});

export default job;

// CRON JOB EXPLANATION:
// Cron jobs are scheduled tasks that run periodically at fixed intervals
// we want to send 1 GET request for every 14 minutes

// How to define a "Schedule"?
// You define a schedule using a cron expression, which consists of five fields representing:

//! MINUTE, HOUR, DAY OF MONTH, MONTH, and DAY OF WEEK
//? EXAMPLES && EXPLANATION:
//* 14 * * * * - Every 14 minutes
//* 0 0 * * 0 - At midnight on every Sunday
//* 30 3 15 * * - At 3:30 AM, on the 15th of every month
//* 0 0 1 1 * - At midnight on January 1st every year
//* 0 * * * * - At the start of every hour