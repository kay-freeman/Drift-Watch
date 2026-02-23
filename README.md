# DriftWatch

DriftWatch is a configuration auditing tool designed to detect and automatically remediate discrepancies between defined infrastructure policies and live environment states. It provides a programmatic way to enforce infrastructure standards and maintain visibility into configuration drift.

## Problem Statement
In production environments, manual changes frequently referred to as hotfixes are often applied directly to resources without being reflected in the version controlled configuration. This leads to configuration drift, making infrastructure difficult to replicate, audit, and secure.

## Current Functionality
* Policy as Code: Infrastructure requirements are defined using standardized YAML syntax.
* Multi Resource Support: Automatically crawls the policies directory to audit multiple resources simultaneously.
* Schema Enforcement: Utilizes Zod for strict type validation of ports and protocols.
* Drift Detection: Real time comparison between Desired vs. Live state.
* Formatted Reporting: Terminal based dashboard using tables for high visibility.
* CLI Arguments: Support for --fix flag to toggle between Dry Run and Remediation.
* Historical Logging: Persistent SQLite database storage for long term compliance tracking.
* Audit History: Dedicated --history flag to view past audit performance and trends directly from the database.

## Technical Stack
* Language: TypeScript
* Database: SQLite3
* Validation Framework: Zod
* Configuration Format: YAML (Policy) / JSON (Live State)
* Runtime: Node.js

## Getting Started

### 1. Installation
Install the necessary dependencies to handle YAML parsing, database operations, and TypeScript execution:

    npm install

### 2. Setup Configuration
Organize your project structure to support the multi policy engine:

1. Create a policies directory in your root folder.
2. Place your YAML policy files inside that folder (e.g., policies/db.yaml).

**Example Policy (policies/db.yaml)**

    resource_name: production-db-firewall
    rules:
      - id: web-to-db
        port: 5432
        protocol: tcp

### 3. Usage

Manual Audit (Dry Run):

    npx ts-node index.ts

Manual Fix (Remediation):

    npx ts-node index.ts --fix

View Audit History (Database Logs):

    npx ts-node index.ts --history

Autopilot Mode (Continuous Monitoring):

    ./watch.sh

## Schema Definition
All policies must follow this structure:
* resource_name: Unique identifier (matches live-state.json keys).
* rules: List of objects containing id, port, and protocol (tcp, udp, or icmp).

## Project Roadmap

### Core Engine (Completed)
* [x] Phase 1: Policy Validation: Ensure YAML configurations are schema compliant.
* [x] Phase 2: State Simulation: Created mock data for live environment testing.
* [x] Phase 3: Drift Detection: Logic implemented to flag discrepancies.
* [x] Phase 4: Auto Remediation: Support for automated fixes with CLI flag control.
* [x] Phase 5: Audit Logging: Persistent tracking of all system actions for compliance.
* [x] Phase 6: Visual Reporting: Terminal dashboard with tabular data display.

### Advanced Logic (Completed)
* [x] Phase 7: Multi Policy Support: Refactored engine to process entire directories.
* [x] Phase 8: Milestone: Commit stable multi resource engine to version control.
* [x] Phase 9: Bidirectional Detection: Logic added to find both extra and missing rules.
* [x] Phase 10: Automation Script: Created shell wrapper for continuous interval auditing.
* [x] Phase 11: Summary Reporting: Added global footer with total issue counts.

### Data & Persistence (In Progress)
* [x] Phase 12: Persistence Layer: Migrated logs to a structured SQLite database.
* [x] Phase 13: History CLI: Implemented --history flag for trend analysis.
* [ ] Phase 14: Database Maintenance: Add a --clear flag to prune old audit logs.
* [ ] Phase 15: Export Functionality: Support for exporting audit history to CSV or JSON.

### Engineering Excellence (Upcoming)
* [ ] Phase 16: Unit Testing: Implement Jest tests for the drift detection logic.
* [ ] Phase 17: Notification System: Integration with Slack webhooks for real time drift alerts.
* [ ] Phase 18: Security Hardening: Implement CIDR range validation and port range checking.
* [ ] Phase 19: API Integration: Move from JSON simulation to a real cloud provider API (AWS/Azure).
* [ ] Phase 20: CI/CD Integration: Add a GitHub Action to run audits on every pull request.

### Production Readiness (Final)
* [ ] Phase 21: Error Resilience: Implement graceful handling for file system permissions and DB locks.
* [ ] Phase 22: Containerization: Create a Dockerfile for consistent cross platform execution.
* [ ] Phase 23: Performance Profiling: Optimize file crawling for environments with 100+ policies.
* [ ] Phase 24: Interactive CLI: Implement a prompt based wizard for initial policy creation.
* [ ] Phase 25: Documentation: Generate TypeDoc API documentation for the core engine.