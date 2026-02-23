/**
 * DriftWatch
 * @description Infrastructure configuration drift detection and auto-remediation engine.
 * @author Kay Freeman
 * @license MIT
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { z } from 'zod';
import { Table } from 'console-table-printer';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { Parser } from 'json2csv'; // New Import

// --- Types & Schemas ---

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

interface AuditResult {
  resource: string;
  status: 'COMPLIANT' | 'DRIFT';
  details: string;
  action: 'REPORTED' | 'FIXED' | 'NONE';
}

// --- Database Setup ---

async function setupDatabase() {
  const db = await open({
    filename: './drift_history.db',
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      resource TEXT,
      status TEXT,
      details TEXT
    )
  `);
  return db;
}

// --- Core Logic ---

async function runAudit() {
  const isFixMode = process.argv.includes('--fix');
  const isHistoryMode = process.argv.includes('--history');
  const isClearMode = process.argv.includes('--clear');
  const isExportMode = process.argv.includes('--export'); // New Flag

  const db = await setupDatabase();

  if (isClearMode) {
    await db.run('DELETE FROM audit_logs');
    console.log('✅ Audit history cleared.');
    return;
  }

  // --- NEW EXPORT LOGIC ---
  if (isExportMode) {
    const logs = await db.all('SELECT * FROM audit_logs ORDER BY timestamp DESC');
    if (logs.length === 0) {
      console.log('❌ No logs found to export.');
      return;
    }

    try {
      const parser = new Parser();
      const csv = parser.parse(logs);
      const filename = `audit_export_${Date.now()}.csv`;
      fs.writeFileSync(filename, csv);
      console.log(`✅ Audit history successfully exported to: ${filename}`);
    } catch (err) {
      console.error('❌ Failed to export CSV:', err);
    }
    return;
  }

  if (isHistoryMode) {
    const logs = await db.all('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10');
    if (logs.length === 0) {
      console.log('No audit history found.');
    } else {
      const historyTable = new Table({
        title: 'HISTORICAL AUDIT LOGS (Last 10)',
        columns: [
          { name: 'timestamp', title: 'Time' },
          { name: 'resource', title: 'Resource' },
          { name: 'status', title: 'Status' },
          { name: 'details', title: 'Details' },
          { name: 'id', title: 'id' }
        ],
      });
      logs.forEach(log => historyTable.addRow(log));
      historyTable.printTable();
    }
    return;
  }

  // Load States
  const liveStateRaw = JSON.parse(fs.readFileSync('./live-state.json', 'utf8'));
  const policiesDir = './policies';
  const policyFiles = fs.readdirSync(policiesDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

  const auditResults: AuditResult[] = [];
  let totalDriftCount = 0;

  for (const file of policyFiles) {
    try {
      const fileContents = fs.readFileSync(path.join(policiesDir, file), 'utf8');
      const policy = PolicySchema.parse(yaml.load(fileContents));
      const resourceName = policy.resource_name;
      const liveRules = liveStateRaw[resourceName]?.active_rules || [];

      const missingRules = policy.rules.filter(
        p => !liveRules.some((l: Rule) => l.id === p.id && l.port === p.port && l.protocol === p.protocol)
      );

      const extraRules = liveRules.filter(
        (l: Rule) => !policy.rules.some(p => p.id === l.id && p.port === l.port && p.protocol === l.protocol)
      );

      if (missingRules.length === 0 && extraRules.length === 0) {
        auditResults.push({
          resource: resourceName,
          status: 'COMPLIANT',
          details: 'Matches Policy',
          action: 'NONE',
        });
      } else {
        const driftDetails = [
          ...extraRules.map((r: Rule) => `Extra: ${r.id}`),
          ...missingRules.map((r: Rule) => `Missing: ${r.id}`)
        ].join(', ');

        totalDriftCount += (extraRules.length + missingRules.length);

        if (isFixMode) {
          liveStateRaw[resourceName].active_rules = policy.rules;
          auditResults.push({
            resource: resourceName,
            status: 'DRIFT',
            details: driftDetails,
            action: 'FIXED',
          });
        } else {
          auditResults.push({
            resource: resourceName,
            status: 'DRIFT',
            details: driftDetails,
            action: 'REPORTED',
          });
        }

        // Log to Database
        await db.run(
          'INSERT INTO audit_logs (resource, status, details) VALUES (?, ?, ?)',
          [resourceName, 'DRIFT', driftDetails]
        );
      }
    } catch (err) {
      console.error(`❌ Error processing policy ${file}:`, err instanceof Error ? err.message : err);
    }
  }

  // Save changes if in fix mode
  if (isFixMode) {
    fs.writeFileSync('./live-state.json', JSON.stringify(liveStateRaw, null, 2));
  }

  // --- Final Reporting ---
  console.log(`\nDRIFTWATCH AUDIT REPORT - ${new Date().toLocaleString()}`);
  console.log(`MODE: ${isFixMode ? 'REMEDIATION' : 'DRY RUN'}\n`);

  const reportTable = new Table({
    columns: [
      { name: 'resource', title: 'Resource', alignment: 'left' },
      { name: 'status', title: 'Status' },
      { name: 'details', title: 'Drift Details', alignment: 'left' },
      { name: 'action', title: 'Action' },
    ],
  });

  auditResults.forEach(res => {
    const color = res.status === 'COMPLIANT' ? 'green' : 'yellow';
    reportTable.addRow(
      { 
        resource: res.resource, 
        status: res.status === 'COMPLIANT' ? '✅ OK' : '⚠️ DRIFT', 
        details: res.details, 
        action: res.action 
      }, 
      { color }
    );
  });

  reportTable.printTable();

  console.log('------------------------------------------');
  console.log('SUMMARY:');
  console.log(`Total Resources Audited: ${auditResults.length}`);
  console.log(`Total Drift Issues Found: ${totalDriftCount}`);
  console.log(`Status: ${totalDriftCount > 0 ? 'NON-COMPLIANT' : 'COMPLIANT'}`);
  console.log('------------------------------------------\n');
}

runAudit().catch(console.error);