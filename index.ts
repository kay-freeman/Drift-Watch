import fs from 'fs';
import YAML from 'yaml';
import { z } from 'zod';

// SAFETY VALVE: Set to true to only report drift without fixing it
const DRY_RUN = false;

const RuleSchema = z.object({
  id: z.string(),
  port: z.number(),
  protocol: z.string()
});

const InfrastructureSchema = z.object({
  resource_name: z.string(),
  rules: z.array(RuleSchema)
});

function auditEnvironment() {
  try {
    const yamlFile = fs.readFileSync('./infrastructure.yaml', 'utf8');
    const desiredState = InfrastructureSchema.parse(YAML.parse(yamlFile));

    const jsonFile = fs.readFileSync('./live-state.json', 'utf8');
    let liveState = JSON.parse(jsonFile);

    console.log(`--- Audit Started: ${desiredState.resource_name} ---`);
    console.log(`--- Mode: ${DRY_RUN ? 'DRY RUN (No changes)' : 'LIVE REMEDIATION'} ---`);

    const desiredIds = desiredState.rules.map(r => r.id);
    const driftingRules = liveState.active_rules.filter(
      (liveRule: any) => !desiredIds.includes(liveRule.id)
    );

    if (driftingRules.length > 0) {
      console.error(`🚨 DRIFT: Found ${driftingRules.length} unauthorized rules.`);
      
      if (DRY_RUN) {
        console.log("🔍 [DRY RUN] Would remove the following rules:");
        driftingRules.forEach((r: any) => console.log(`  - ${r.id}`));
      } else {
        console.log("🛠  Auto-remediating... Synchronizing live state to policy.");
        liveState.active_rules = liveState.active_rules.filter(
          (liveRule: any) => desiredIds.includes(liveRule.id)
        );
        fs.writeFileSync('./live-state.json', JSON.stringify(liveState, null, 2));
        console.log("✅ Remediation Complete.");
      }
    } else {
      console.log("✅ No drift detected. Environment is secure.");
    }

  } catch (error) {
    console.error("❌ Audit failed:", error);
  }
}

auditEnvironment();