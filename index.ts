import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as yaml from 'js-yaml';
import { z } from 'zod';
import Table from 'cli-table3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RuleSchema = z.object({
  id: z.string(),
  port: z.number().min(1).max(65535),
  protocol: z.enum(['tcp', 'udp', 'icmp']),
});

const PolicySchema = z.object({
  resource_name: z.string(),
  rules: z.array(RuleSchema),
});

const liveStatePath = path.join(__dirname, 'live-state.json');
let liveData = JSON.parse(fs.readFileSync(liveStatePath, 'utf8'));

const policiesDir = path.join(__dirname, 'policies');
const auditLogPath = path.join(__dirname, 'audit.log');
const isFixMode = process.argv.includes('--fix');

function logAction(message: string) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(auditLogPath, entry);
}

function runAudit() {
  const table = new Table({
    head: ['Resource', 'Status', 'Drift Details', 'Action'],
    colWidths: [25, 12, 35, 15]
  });

  if (!fs.existsSync(policiesDir)) {
    console.error("Error: 'policies' folder not found.");
    return;
  }

  const files = fs.readdirSync(policiesDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
  let driftExists = false;

  files.forEach(file => {
    try {
      const content = fs.readFileSync(path.join(policiesDir, file), 'utf8');
      const parsedYaml = yaml.load(content);
      const result = PolicySchema.safeParse(parsedYaml);
      
      if (!result.success) {
        table.push([file, '❌ ERROR', 'Invalid Schema', 'None']);
        return;
      }

      const { resource_name: resource, rules: desired } = result.data;

      if (!liveData[resource]) {
        table.push([resource, '❓ MISSING', 'Not found in live state', 'None']);
        return;
      }

      const active = liveData[resource].active_rules;
      const drift = active.filter((live: any) => !desired.some(p => p.id === live.id));

      if (drift.length === 0) {
        table.push([resource, '✅ OK', 'Matches Policy', 'None']);
      } else {
        driftExists = true;
        const driftList = drift.map((r: any) => `${r.id} (${r.port}/${r.protocol})`).join(', ');
        
        if (isFixMode) {
          drift.forEach((r: any) => logAction(`REMEDIATED: Removed ${r.id} from ${resource}`));
          liveData[resource].active_rules = active.filter((live: any) => desired.some(p => p.id === live.id));
          table.push([resource, '🔧 FIXED', driftList, 'REMOVED']);
        } else {
          drift.forEach((r: any) => logAction(`DRIFT DETECTED: ${resource} has unauthorized rule ${r.id}`));
          table.push([resource, '⚠️  DRIFT', driftList, 'REPORTED']);
        }
      }

    } catch (err) {
      table.push([file, '❌ SYSERR', 'Check console', 'None']);
    }
  });

  // Render Output
  console.log(`\nDRIFTWATCH AUDIT REPORT - ${new Date().toLocaleString()}`);
  console.log(`MODE: ${isFixMode ? 'REMEDIATION' : 'DRY RUN'}\n`);
  console.log(table.toString());

  if (isFixMode && driftExists) {
    fs.writeFileSync(liveStatePath, JSON.stringify(liveData, null, 2));
    console.log(`\n✅ Live state synchronized successfully.\n`);
  } else if (driftExists) {
    console.log(`\n💡 Tip: Use --fix to remediate detected drift.\n`);
  }
}

runAudit();