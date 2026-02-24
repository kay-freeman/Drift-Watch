import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { z } from 'zod';
import { Table } from 'console-table-printer';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { Parser } from 'json2csv';

/**
 * DriftWatch Core Engine
 * Author: Kay Freeman
 * License: MIT
 */

const RuleSchema = z.object({
  id: z.string(),
  port: z.number().min(1).max(65535),
  protocol: z.enum(['tcp', 'udp', 'icmp']),
});

const PolicySchema = z.object({
  resource_name: z.string(),
  rules: z.array(RuleSchema),
});

type Policy = z.infer<typeof PolicySchema>;

async function initDB() {
  const db = await open({
    filename: './drift_history.db',
    driver: sqlite3.Database
  });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      resource_name TEXT,
      drift_type TEXT,
      rule_id TEXT,
      port INTEGER,
      protocol TEXT
    )
  `);
  return db;
}

// New High-Fidelity Export for the Web Dashboard
async function exportDetailedAudit(policies: string[], drifts: any[]) {
    const data = {
        summary: {
            timestamp: new Date().toLocaleString(),
            policies: policies.length,
            drifts: drifts.length
        },
        details: {
            policies: policies,
            drifts: drifts
        }
    };
    const docsDir = path.join(process.cwd(), 'docs');
    if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir);
    fs.writeFileSync(path.join(docsDir, 'audit-results.json'), JSON.stringify(data, null, 2));
}

async function runAudit() {
  const db = await initDB();
  const args = process.argv.slice(2);
  const isFixMode = args.includes('--fix');
  const isHistoryMode = args.includes('--history');
  const isClearMode = args.includes('--clear');
  const isExportMode = args.includes('--export');

  if (isClearMode) {
    await db.exec('DELETE FROM audit_logs');
    console.log('🗑️  Audit history cleared.');
    return;
  }

  if (isHistoryMode) {
    const history = await db.all('SELECT * FROM audit_logs ORDER BY timestamp DESC');
    if (history.length === 0) {
      console.log("No history found.");
    } else {
      const historyTable = new Table();
      history.forEach(row => historyTable.addRow(row));
      historyTable.printTable();
    }
    return;
  }

  const liveState = JSON.parse(fs.readFileSync('live-state.json', 'utf8'));
  const policyFiles = fs.readdirSync('./policies').filter(f => f.endsWith('.yaml'));
  
  const reportTable = new Table();
  const webDrifts: any[] = [];
  const webPolicies: string[] = [];

  for (const file of policyFiles) {
    const rawYaml = yaml.load(fs.readFileSync(path.join('./policies', file), 'utf8'));
    const policy = PolicySchema.parse(rawYaml);
    webPolicies.push(policy.resource_name);
    
    const liveRules = Array.isArray(liveState[policy.resource_name]) 
      ? liveState[policy.resource_name] 
      : [];

    const missing = policy.rules.filter(p => !liveRules.some((l: any) => l.id === p.id));
    const extra = liveRules.filter((l: any) => !policy.rules.some(p => p.id === l.id));

    for (const rule of missing) {
      const entry = { resource: policy.resource_name, status: 'MISSING', ...rule };
      reportTable.addRow(entry, { color: 'red' });
      webDrifts.push(entry);
      await db.run('INSERT INTO audit_logs (resource_name, drift_type, rule_id, port, protocol) VALUES (?, ?, ?, ?, ?)', 
        [policy.resource_name, 'MISSING', rule.id, rule.port, rule.protocol]);
      if (isFixMode) {
          if (!liveState[policy.resource_name]) liveState[policy.resource_name] = [];
          liveState[policy.resource_name].push(rule);
      }
    }

    for (const rule of extra) {
      const entry = { resource: policy.resource_name, status: 'EXTRA', ...rule };
      reportTable.addRow(entry, { color: 'yellow' });
      webDrifts.push(entry);
      await db.run('INSERT INTO audit_logs (resource_name, drift_type, rule_id, port, protocol) VALUES (?, ?, ?, ?, ?)', 
        [policy.resource_name, 'EXTRA', rule.id, rule.port, rule.protocol]);
      if (isFixMode) {
        liveState[policy.resource_name] = liveState[policy.resource_name].filter((r: any) => r.id !== rule.id);
      }
    }
  }

  if (webDrifts.length > 0 || webPolicies.length > 0) {
      reportTable.printTable();
  }
  
  if (isFixMode) fs.writeFileSync('live-state.json', JSON.stringify(liveState, null, 2));
  
  // Update the detailed web dashboard data
  await exportDetailedAudit(webPolicies, webDrifts);
  console.log(`\nAudit Complete. ${webDrifts.length} issues found. Web Dashboard Synced.`);
}

runAudit().catch(err => console.error('❌ Critical Error:', err.message));