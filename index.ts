import fs from 'fs';
import YAML from 'yaml';
import { z } from 'zod';

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
      throw new Error("Missing configuration files.");
    }

    const yamlFile = fs.readFileSync('./infrastructure.yaml', 'utf8');
    const desiredState = InfrastructureSchema.parse(YAML.parse(yamlFile));

    const jsonFile = fs.readFileSync('./live-state.json', 'utf8');
    let liveState = JSON.parse(jsonFile);

    console.clear();
    logEvent(`--- DriftWatch Audit: ${desiredState.resource_name} ---`);
    logEvent(`Mode: ${IS_FIX_MODE ? 'LIVE REMEDIATION' : 'DRY RUN'}`);

    const desiredIds = desiredState.rules.map(r => r.id);
    
    // Build a status report for the table
    const report = liveState.active_rules.map((rule: any) => ({
      Rule_ID: rule.id,
      Port: rule.port,
      Status: desiredIds.includes(rule.id) ? '✅ AUTHORIZED' : '🚨 UNAUTHORIZED'
    }));

    console.table(report);

    const driftingRules = liveState.active_rules.filter(
      (liveRule: any) => !desiredIds.includes(liveRule.id)
    );

    if (driftingRules.length > 0) {
      logEvent(`Found ${driftingRules.length} security violations.`);
      
      if (IS_FIX_MODE) {
        logEvent("🛠  Fixing drift...");
        liveState.active_rules = liveState.active_rules.filter(
          (liveRule: any) => desiredIds.includes(liveRule.id)
        );
        fs.writeFileSync('./live-state.json', JSON.stringify(liveState, null, 2));
        logEvent("✅ Environment Restored.");
      } else {
        logEvent("🔍 Use '--fix' to remove unauthorized rules.");
      }
    } else {
      logEvent("✅ System is compliant.");
    }

  } catch (error) {
    logEvent(`❌ FATAL ERROR: ${error instanceof Error ? error.message : String(error)}`);
  }
}

auditEnvironment();