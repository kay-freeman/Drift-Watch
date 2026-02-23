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

async function updateWebDashboard(policyCount: number, driftCount: number) {
  const summary = {
    timestamp: new Date().toLocaleString(),
    policies: policyCount,
    drifts: driftCount
  };
  const docsDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir);
  fs.writeFileSync(path.join(docsDir, 'summary.json'), JSON.stringify(summary, null, 2));
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

  if (isExportMode) {
    const data = await db.all('SELECT * FROM audit_logs');
    if (data.length === 0) {
        console.log("No data to export.");
        return;
    }
    const parser = new Parser();
    const csv = parser.parse(data);
    const fileName = `audit_export_${Date.now()}.csv`;
    fs.writeFileSync(fileName, csv);
    console.log(`📊 Exported history to ${fileName}`);
    return;
  }

  const liveState = JSON.parse(fs.readFileSync('live-state.json', 'utf8'));
  const policyFiles = fs.readdirSync('./policies').filter(f => f.endsWith('.yaml'));
  
  const reportTable = new Table();
  let totalDrifts = 0;

  for (const file of policyFiles) {
    const rawYaml = yaml.load(fs.readFileSync(path.join('./policies', file), 'utf8'));
    const policy = PolicySchema.parse(rawYaml);
    
    // Safety check: Ensure liveRules is always an array
    const liveRules = Array.isArray(liveState[policy.resource_name]) 
      ? liveState[policy.resource_name] 
      : [];

    const missing = policy.rules.filter(p => !liveRules.some((l: any) => l.id === p.id));
    const extra = liveRules.filter((l: any) => !policy.rules.some(p => p.id === l.id));

    totalDrifts += (missing.length + extra.length);

    for (const rule of missing) {
      reportTable.addRow({ resource: policy.resource_name, status: 'MISSING', ...rule }, { color: 'red' });
      await db.run('INSERT INTO audit_logs (resource_name, drift_type, rule_id, port, protocol) VALUES (?, ?, ?, ?, ?)', 
        [policy.resource_name, 'MISSING', rule.id, rule.port, rule.protocol]);
      if (isFixMode) {
          if (!liveState[policy.resource_name]) liveState[policy.resource_name] = [];
          liveState[policy.resource_name].push(rule);
      }
    }

    for (const rule of extra) {
      reportTable.addRow({ resource: policy.resource_name, status: 'EXTRA', ...rule }, { color: 'yellow' });
      await db.run('INSERT INTO audit_logs (resource_name, drift_type, rule_id, port, protocol) VALUES (?, ?, ?, ?, ?)', 
        [policy.resource_name, 'EXTRA', rule.id, rule.port, rule.protocol]);
      if (isFixMode) {
        liveState[policy.resource_name] = liveState[policy.resource_name].filter((r: any) => r.id !== rule.id);
      }
    }
  }

  if (totalDrifts > 0 || policyFiles.length > 0) {
      reportTable.printTable();
  } else {
      console.log("✅ No policies found or environment is clean.");
  }
  
  if (isFixMode) fs.writeFileSync('live-state.json', JSON.stringify(liveState, null, 2));
  
  await updateWebDashboard(policyFiles.length, totalDrifts);
  console.log(`\nAudit Complete. ${totalDrifts} issues found. Dashboard updated.`);
}

runAudit().catch(err => console.error('❌ Critical Error:', err.message));