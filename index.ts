import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { z } from 'zod';
import { Table } from 'console-table-printer';
import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';

// --- 1. Schemas ---
const RuleSchema = z.object({
  id: z.string(),
  port: z.number(),
  protocol: z.enum(['tcp', 'udp', 'icmp']),
});

const PolicySchema = z.object({
  resource_name: z.string(),
  rules: z.array(RuleSchema),
});

type Rule = z.infer<typeof RuleSchema>;
type Policy = z.infer<typeof PolicySchema>;

// --- 2. Database Service ---
class DatabaseService {
  private db?: Database;

  async init() {
    this.db = await open({
      filename: './drift_history.db',
      driver: sqlite3.Database
    });

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT (datetime('now','localtime')),
        resource_name TEXT,
        status TEXT,
        drift_details TEXT
      )
    `);
  }

  async logAudit(resource: string, status: string, details: string) {
    if (!this.db) return;
    await this.db.run(
      'INSERT INTO audit_logs (resource_name, status, drift_details) VALUES (?, ?, ?)',
      [resource, status, details]
    );
  }

  async getHistory() {
    if (!this.db) return [];
    return await this.db.all('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10');
  }

  async clearHistory() {
    if (!this.db) return;
    await this.db.run('DELETE FROM audit_logs');
    // Vacuum cleans up the unused space and resets the file size
    await this.db.run('VACUUM');
    console.log('✅ Audit history cleared successfully.');
  }
}

// --- 3. Main Execution Engine ---
async function run() {
  const dbService = new DatabaseService();
  await dbService.init();

  const isFixMode = process.argv.includes('--fix');
  const isHistoryMode = process.argv.includes('--history');
  const isClearMode = process.argv.includes('--clear');

  // --- Maintenance Mode ---
  if (isClearMode) {
    await dbService.clearHistory();
    process.exit(0);
  }

  // --- History Mode ---
  if (isHistoryMode) {
    const history = await dbService.getHistory();
    if (history.length === 0) {
      console.log('\nNo audit history found in database.\n');
      process.exit(0);
    }
    const historyTable = new Table({
      title: 'HISTORICAL AUDIT LOGS (Last 10)',
      columns: [
        { name: 'timestamp', title: 'Time', alignment: 'left' },
        { name: 'resource_name', title: 'Resource', alignment: 'left' },
        { name: 'status', title: 'Status', alignment: 'left' },
        { name: 'drift_details', title: 'Details', alignment: 'left' },
      ],
    });
    history.forEach(row => historyTable.addRow(row));
    historyTable.printTable();
    process.exit(0);
  }

  // --- Normal Audit Logic ---
  const liveState = JSON.parse(fs.readFileSync('live-state.json', 'utf8'));
  const policyFiles = fs.readdirSync('./policies').filter(f => f.endsWith('.yaml'));

  const table = new Table({
    columns: [
      { name: 'Resource', alignment: 'left' },
      { name: 'Status', alignment: 'left' },
      { name: 'Drift Details', alignment: 'left' },
      { name: 'Action', alignment: 'left' },
    ],
  });

  let totalResources = 0;
  let totalIssues = 0;

  for (const file of policyFiles) {
    totalResources++;
    const rawYaml = fs.readFileSync(path.join('./policies', file), 'utf8');
    let policy: Policy;

    try {
      policy = PolicySchema.parse(yaml.load(rawYaml));
    } catch (e) {
      table.addRow({ Resource: file, Status: '❌ ERROR', 'Drift Details': 'Invalid Schema', Action: 'None' });
      await dbService.logAudit(file, 'ERROR', 'Invalid Schema');
      continue;
    }

    const resourceName = policy.resource_name;
    const liveRules = liveState[resourceName]?.active_rules || [];

    const extraRules = liveRules.filter((lr: Rule) => !policy.rules.some(pr => pr.id === lr.id));
    const missingRules = policy.rules.filter(pr => !liveRules.some((lr: Rule) => lr.id === pr.id));

    if (extraRules.length === 0 && missingRules.length === 0) {
      table.addRow({ Resource: resourceName, Status: '✅ OK', 'Drift Details': 'Matches Policy', Action: 'None' });
      await dbService.logAudit(resourceName, 'COMPLIANT', 'None');
    } else {
      totalIssues += (extraRules.length + missingRules.length);
      const driftSummary = [...extraRules.map((r: Rule) => `Extra: ${r.id}`), ...missingRules.map((r: Rule) => `Missing: ${r.id}`)].join(', ');
      
      let actionTaken = isFixMode ? 'FIXED' : 'REPORTED';
      
      if (isFixMode) {
        liveState[resourceName].active_rules = policy.rules;
        fs.writeFileSync('live-state.json', JSON.stringify(liveState, null, 2));
      }

      table.addRow({ Resource: resourceName, Status: '⚠️ DRIFT', 'Drift Details': driftSummary, Action: actionTaken });
      await dbService.logAudit(resourceName, 'DRIFT', driftSummary);
    }
  }

  console.log(`\nDRIFTWATCH AUDIT REPORT - ${new Date().toLocaleString()}`);
  console.log(`MODE: ${isFixMode ? 'REMEDIATION' : 'DRY RUN'}\n`);
  table.printTable();

  console.log('\n------------------------------------------');
  console.log('SUMMARY:');
  console.log(`Total Resources Audited: ${totalResources}`);
  console.log(`Total Drift Issues Found: ${totalIssues}`);
  console.log(`Status: ${totalIssues > 0 ? 'NON-COMPLIANT' : 'COMPLIANT'}`);
  console.log('------------------------------------------\n');
}

run();