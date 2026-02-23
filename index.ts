import fs from 'fs';
import YAML from 'yaml';
import { z } from 'zod';

// 1. The Schema (Source of Truth)
const RuleSchema = z.object({
  id: z.string(),
  port: z.number(),
  protocol: z.string()
});

const InfrastructureSchema = z.object({
  resource_name: z.string(),
  rules: z.array(RuleSchema)
});

function detectAndRemediate() {
  try {
    // Read Desired State (YAML)
    const yamlFile = fs.readFileSync('./infrastructure.yaml', 'utf8');
    const desiredState = InfrastructureSchema.parse(YAML.parse(yamlFile));

    // Read Live State (JSON)
    const jsonFile = fs.readFileSync('./live-state.json', 'utf8');
    const liveState = JSON.parse(jsonFile);

    console.log(`--- Monitoring Resource: ${desiredState.resource_name} ---`);

    const desiredIds = desiredState.rules.map(r => r.id);

    // Identify drifting rules
    const driftingRules = liveState.active_rules.filter(
      (liveRule: any) => !desiredIds.includes(liveRule.id)
    );

    if (driftingRules.length > 0) {
      console.error("🚨 DRIFT DETECTED!");
      
      console.log("\n--- Suggested Remediation ---");
      driftingRules.forEach((rule: any) => {
        console.log(`[ACTION REQUIRED] Remove unauthorized rule: ${rule.id}`);
        // This simulates generating a real CLI command for a cloud provider
        console.log(`👉 Run command: gcloud compute firewall-rules delete ${rule.id}`);
      });
      console.log("-----------------------------\n");
    } else {
      console.log("✅ Live state matches policy. No drift detected.");
    }

  } catch (error) {
    console.error("❌ Error running audit:", error);
  }
}

detectAndRemediate();