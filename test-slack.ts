import axios from 'axios';
import * as dotenv from 'dotenv';

// This line loads your URL from the .env file
dotenv.config();

const url = process.env.SLACK_WEBHOOK_URL;

async function testConnection() {
    console.log("Attempting to ping Slack...");
    
    try {
        await axios.post(url!, {
            text: "📡 *DriftWatch Connection Test*\nStatus: Connected\nEngineer: Kay Freeman"
        });
        console.log("✅ Check your #all-drift-watch channel! It should be there.");
    } catch (error) {
        console.error("❌ It failed. Double check your URL in the .env file.");
    }
}

testConnection();