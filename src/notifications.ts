import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

export async function notifySlack(drifts: any[]) {
    const url = process.env.SLACK_WEBHOOK_URL;
    if (!url) return;

    const driftList = drifts.map(d => `• *${d.resource}*: ${d.issue}`).join('\n');

    const payload = {
        text: `🚨 *DriftWatch: Infrastructure Alert*`,
        attachments: [{
            color: "#f85149",
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*Drift Detected:* ${drifts.length} items out of sync.\n\n${driftList}`
                    }
                },
                {
                    type: "context",
                    elements: [{ type: "mrkdwn", text: "Verified by *DriftWatch Engine* | Lead: Kay Freeman" }]
                }
            ]
        }]
    };

    try {
        await axios.post(url, payload);
        console.log("📡 Slack alert dispatched to #all-drift-watch");
    } catch (err) {
        console.error("Failed to dispatch Slack alert");
    }
}