# DriftWatch

DriftWatch is a configuration auditing tool designed to detect and automatically remediate discrepancies between defined infrastructure policies and live environment states. It provides a programmatic way to enforce infrastructure standards and maintain visibility into configuration drift.

## Problem Statement
In production environments, manual changes frequently referred to as hotfixes are often applied directly to resources without being reflected in the version controlled configuration. This leads to configuration drift, making infrastructure difficult to replicate, audit, and secure.

## Interactive Demo
Experience the full lifecycle of drift detection and remediation without manual configuration. The interactive demo simulates real world Chaos Engineering scenarios, including unauthorized changes and policy violations.

To launch the guided experience:

    npm run demo

## Current Functionality
* Policy as Code: Infrastructure requirements are defined using standardized YAML syntax.
* Multi Resource Support: Automatically crawls the policies directory to audit multiple resources simultaneously.
* Schema Enforcement: Utilizes Zod for strict type validation of ports and protocols.
* Drift Detection: Real time comparison between Desired vs. Live state.
* Formatted Reporting: Terminal based dashboard using tables for high visibility.
* CLI Arguments: Support for --fix flag to toggle between Dry Run and Remediation.
* Historical Logging: Persistent SQLite database storage for long term compliance tracking.
* Audit History: Dedicated --history flag to view past audit performance and trends.
* CSV Export: Automated reporting via --export flag to generate timestamped CSV audit logs.
* Live Web Dashboard: GitHub Pages integration showing real-time system health.
* Unit Testing: Automated logic verification via Jest for engineering reliability.

## Technical Stack
* Language: TypeScript
* Database: SQLite3
* Validation Framework: Zod
* Configuration Format: YAML (Policy) / JSON (Live State)
* Runtime: Node.js
* License: MIT

## Getting Started

### 1. Installation
Install the necessary dependencies to handle YAML parsing, database operations, and TypeScript execution:

    npm install

### 2. Manual Usage

Manual Audit (Dry Run):

    npm start

Manual Fix (Remediation):

    npm start -- --fix

View Audit History (Database Logs):

    npm run history

Export Audit History (CSV):

    npm run export

Run Automated Unit Tests:

    npm test

## Project Roadmap

### Core Engine (Completed)
* 🔵 Phase 1: Policy Validation: Ensure YAML configurations are schema compliant.
* 🔵 Phase 2: State Simulation: Created mock data for live environment testing.
* 🔵 Phase 3: Drift Detection: Logic implemented to flag discrepancies.
* 🔵 Phase 4: Auto Remediation: Support for automated fixes with CLI flag control.
* 🔵 Phase 5: Audit Logging: Persistent tracking of all system actions for compliance.
* 🔵 Phase 6: Visual Reporting: Terminal dashboard with tabular data display.

### Advanced Logic (Completed)
* 🔵 Phase 7: Multi Policy Support: Refactored engine to process entire directories.
* 🔵 Phase 8: Milestone: Commit stable multi resource engine to version control.
* 🔵 Phase 9: Bidirectional Detection: Logic added to find both extra and missing rules.
* 🔵 Phase 10: Automation Script: Created shell wrapper for continuous interval auditing.
* 🔵 Phase 11: Summary Reporting: Added global footer with total issue counts.

### Data & Persistence (Completed)
* 🔵 Phase 12: Persistence Layer: Migrated logs to a structured SQLite database.
* 🔵 Phase 13: History CLI: Implemented --history flag for trend analysis.
* 🔵 Phase 14: Database Maintenance: Add a --clear flag to prune old audit logs.
* 🔵 Phase 15: Export Functionality: Support for exporting audit history to CSV via --export.

### Engineering Excellence (Ongoing)
* 🔵 Phase 16: Unit Testing: Implement Jest tests and automated logic verification.
* 🔵 Phase 17: Notification System: Integration with Slack webhooks for real time drift alerts.
* ⚪ Phase 18: Security Hardening: Implement CIDR range validation and port range checking.
* ⚪ Phase 19: API Integration: Move from JSON simulation to a real cloud provider API.
* ⚪ Phase 20: CI/CD Integration: Add a GitHub Action to run audits on every pull request.

---
Author: Kay Freeman
License: MIT