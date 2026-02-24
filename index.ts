import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

interface DriftItem {
    resource: string;
    issue: string;
    expected: string;
    actual: string;
}

/**
 * PHASE 17: Slack Notification Engine
 */
async function notifySlack(drifts: DriftItem[]) {
    const url = process.env.SLACK_WEBHOOK_URL;
    if (!url) {
        console.error("⚠️ SLACK_WEBHOOK_URL not found in .env file.");
        return;
    }

    const driftList = drifts.map(d => `• *${d.resource}*: ${d.issue} (Expected: \`${d.expected}\` | Actual: \`${d.actual}\`)`).join('\n');

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
        console.log("📡 Slack alert successfully dispatched to #all-drift-watch.");
    } catch (err) {
        console.error("❌ Failed to send Slack alert.");
    }
}

/**
 * MAIN AUDIT ENGINE
 */
async function runAudit() {
    console.log("🔍 Starting Infrastructure Audit...");
    
    // Simulating drift detection logic for demonstration
    // In production, this pulls from your policy and state files
    const foundDrifts: DriftItem[] = [
        {
            resource: "Production-DB-Security-Group",
            issue: "Unauthorized Port Open",
            expected: "Port 5432",
            actual: "Port 5432, Port 22"
        }
    ];

    if (foundDrifts.length > 0) {
        console.log(`❗ Detected ${foundDrifts.length} drift(s).`);
        
        // Trigger Phase 17 Notification
        await notifySlack(foundDrifts);
        
    } else {
        console.log("✅ Environment is synchronized. No drift detected.");
    }
}

// Execute
runAudit().catch(err => console.error("Fatal Engine Error:", err));