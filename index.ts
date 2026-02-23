import fs from 'fs';
import YAML from 'yaml';
import { z } from 'zod';

// Check terminal arguments for the --fix flag
const args = process.argv.slice(2);
const IS_FIX_MODE = args.includes('--fix');

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
    if (!fs.existsSync('./infrastructure.yaml') || !fs.existsSync('./live-state.json')) {
      throw new Error("Missing configuration files. Ensure infrastructure.yaml and live-state.json exist.");
    }

    const yamlFile = fs.readFileSync('./infrastructure.yaml', 'utf8');
    const desiredState = InfrastructureSchema.parse(YAML.parse(yamlFile));

    const jsonFile = fs.readFileSync('./live-state.json', 'utf8');
    let liveState = JSON.parse(jsonFile);

    logEvent(`--- Audit Started: ${desiredState.resource_name} ---`);
    logEvent(`Mode: ${IS_FIX_MODE ? 'LIVE REMEDIATION' : 'DRY RUN (Read-Only)'}`);

    const desiredIds = desiredState.rules.map(r => r.id);
    const driftingRules = liveState.active_rules.filter(
      (liveRule: any) => !desiredIds.includes(liveRule.id)
    );

    if (driftingRules.length > 0) {
      logEvent(`🚨 DRIFT: Found ${driftingRules.length} unauthorized rules.`);
      
      if (!IS_FIX_MODE) {
        logEvent("🔍 [DRY RUN] No changes made. Use '--fix' to apply changes.");
        driftingRules.forEach((r: any) => logEvent(`   -> Potential removal: ${r.id}`));
      } else {
        logEvent("🛠  Applying Fixes... Removing unauthorized rules.");
        liveState.active_rules = liveState.active_rules.filter(
          (liveRule: any) => desiredIds.includes(liveRule.id)
        );
        fs.writeFileSync('./live-state.json', JSON.stringify(liveState, null, 2));
        logEvent("✅ Remediation Complete. Live state is now clean.");
      }
    } else {
      logEvent("✅ No drift detected. Environment is secure.");
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logEvent(`❌ FATAL ERROR: ${errorMessage}`);
  }
}

auditEnvironment();