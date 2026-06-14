import cron from "cron";
import https from "https";
import http from "http";
import { URL } from "url";

const job = new cron.CronJob("*/14 * * * *", () => {
    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
        console.log('API_URL not set; skipping scheduled GET request.');
        return;
    }

    let parsed;
    try {
        parsed = new URL(apiUrl);
    } catch (err) {
        console.error('Invalid API_URL:', apiUrl);
        return;
    }

    const client = parsed.protocol === 'http:' ? http : https;
    const maxAttempts = 2;
    const requestTimeoutMs = 5000;

    const doRequest = (attempt = 1) => {
        const start = Date.now();
        const req = client.get(apiUrl, (res) => {
            const { statusCode } = res;
            if (statusCode >= 200 && statusCode < 300) {
                console.log(`[cron] GET ${apiUrl} succeeded (${statusCode}) in ${Date.now() - start}ms`);
            } else if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
                const location = res.headers.location;
                console.log(`[cron] GET ${apiUrl} redirected to ${location} (status ${statusCode})`);
                if (attempt < maxAttempts) {
                    setTimeout(() => doRequest(attempt + 1), 500);
                }
            } else {
                console.warn(`[cron] GET ${apiUrl} failed with status ${statusCode}`);
                if (attempt < maxAttempts) {
                    setTimeout(() => doRequest(attempt + 1), 500 * attempt);
                }
            }

            // consume response to free socket
            res.on('data', () => {});
            res.on('end', () => {});
        });

        req.on('error', (e) => {
            console.error(`[cron] Error making GET request (attempt ${attempt}):`, e.message || e);
            if (attempt < maxAttempts) {
                setTimeout(() => doRequest(attempt + 1), 500 * attempt);
            }
        });

        req.setTimeout(requestTimeoutMs, () => {
            req.abort();
            console.error(`[cron] GET ${apiUrl} timed out after ${requestTimeoutMs}ms (attempt ${attempt})`);
        });
    };

    try {
        doRequest();
    } catch (err) {
        console.error('[cron] Unhandled error in scheduled GET:', err);
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