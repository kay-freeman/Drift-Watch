import fs from 'fs';
import YAML from 'yaml';
import { z } from 'zod';

// SAFETY VALVE: Set to true to only report drift without fixing it
const DRY_RUN = true;

const RuleSchema = z.object({
  id: z.string(),
  port: z.number(),
  protocol: z.string()
});

const InfrastructureSchema = z.object({
  resource_name: z.string(),
  rules: z.array(RuleSchema)
});

function logEvent(message: string) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  fs.appendFileSync('./audit.log', logEntry);
  console.log(message);
}

function auditEnvironment() {
  try {
    const yamlFile = fs.readFileSync('./infrastructure.yaml', 'utf8');
    const desiredState = InfrastructureSchema.parse(YAML.parse(yamlFile));

    const jsonFile = fs.readFileSync('./live-state.json', 'utf8');
    let liveState = JSON.parse(jsonFile);

    logEvent(`--- Audit Started: ${desiredState.resource_name} ---`);
    logEvent(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE REMEDIATION'}`);

    const desiredIds = desiredState.rules.map(r => r.id);
    const driftingRules = liveState.active_rules.filter(
      (liveRule: any) => !desiredIds.includes(liveRule.id)
    );

    if (driftingRules.length > 0) {
      logEvent(`🚨 DRIFT: Found ${driftingRules.length} unauthorized rules.`);
      
      if (DRY_RUN) {
        driftingRules.forEach((r: any) => logEvent(`🔍 [DRY RUN] Would remove rule: ${r.id}`));
      } else {
        logEvent("🛠  Auto-remediating... Synchronizing live state to policy.");
        liveState.active_rules = liveState.active_rules.filter(
          (liveRule: any) => desiredIds.includes(liveRule.id)
        );
        fs.writeFileSync('./live-state.json', JSON.stringify(liveState, null, 2));
        logEvent("✅ Remediation Complete.");
      }
    } else {
      logEvent("✅ No drift detected. Environment is secure.");
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logEvent(`❌ Audit failed: ${errorMessage}`);
  }
}

auditEnvironment();