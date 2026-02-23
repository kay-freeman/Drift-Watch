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

function detectDrift() {
  try {
    // Read Desired State (YAML)
    const yamlFile = fs.readFileSync('./infrastructure.yaml', 'utf8');
    const desiredState = InfrastructureSchema.parse(YAML.parse(yamlFile));

    // Read Live State (JSON)
    const jsonFile = fs.readFileSync('./live-state.json', 'utf8');
    const liveState = JSON.parse(jsonFile);

    console.log(`--- Monitoring Resource: ${desiredState.resource_name} ---`);

    // Create sets of IDs for quick comparison
    const desiredIds = desiredState.rules.map(r => r.id);
    const liveIds = liveState.active_rules.map((r: any) => r.id);

    // Find rules in Live State that are NOT in our Desired State (The Drift)
    const driftingRules = liveState.active_rules.filter(
      (liveRule: any) => !desiredIds.includes(liveRule.id)
    );

    if (driftingRules.length > 0) {
      console.error("🚨 DRIFT DETECTED!");
      driftingRules.forEach((rule: any) => {
        console.error(` > Unauthorized rule found: ${rule.id} on port ${rule.port}`);
      });
    } else {
      console.log("✅ Live state matches policy. No drift detected.");
    }

  } catch (error) {
    console.error("❌ Error running audit:", error);
  }
}

detectDrift();