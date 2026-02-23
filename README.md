# DriftWatch

DriftWatch is a configuration auditing tool designed to detect and automatically remediate discrepancies between defined infrastructure policies and live environment states. It provides a programmatic way to enforce infrastructure standards and maintain visibility into configuration drift.

## Problem Statement
In production environments, manual changes frequently referred to as "hotfixes" are often applied directly to resources without being reflected in the version-controlled configuration. This leads to configuration drift, making infrastructure difficult to replicate, audit, and secure.

## Current Functionality
* **Policy as Code**: Infrastructure requirements are defined using standardized YAML syntax.
* **Schema Enforcement**: Utilizes Zod for strict type validation of ports and protocols.
* **Drift Detection**: Real-time comparison between Desired vs. Live state.
* **Formatted Reporting**: Terminal-based dashboard using tables for high visibility.
* **CLI Arguments**: Support for `--fix` flag to toggle between Dry Run and Remediation.
* **Auto-Remediation**: Programmatic synchronization to restore policy state.
* **Audit Logging**: Maintains a persistent `audit.log` for historical compliance tracking.

## Technical Stack
* **Language**: TypeScript
* **Validation Framework**: Zod
* **Configuration Format**: YAML (Policy) / JSON (Live State)
* **Runtime**: Node.js

## Getting Started

### 1. Installation
Install the necessary dependencies to handle YAML parsing and TypeScript execution:

```bash
npm install
2. Setup Configuration
Create the following files in your root directory to define your environment:

infrastructure.yaml (Your Policy)

YAML
resource_name: production-db-firewall
rules:
  - id: web-to-db
    port: 5432
    protocol: tcp
live-state.json (The Simulated Reality)

JSON
{
  "resource_name": "production-db-firewall",
  "active_rules": [
    { "id": "web-to-db", "port": 5432, "protocol": "tcp" },
    { "id": "unauthorized-access", "port": 9999, "protocol": "tcp" }
  ]
}
3. Usage
Audit only (Dry Run):

Bash
npx ts-node index.ts
Audit and Fix (Remediation):

Bash
npx ts-node index.ts --fix
Project Roadmap
[x] Phase 1: Policy Validation: Ensure YAML configurations are schema-compliant.

[x] Phase 2: State Simulation: Created mock data for live environment testing.

[x] Phase 3: Drift Detection: Logic implemented to flag discrepancies.

[x] Phase 4: Auto-Remediation: Support for automated fixes with CLI flag control.

[x] Phase 5: Audit Logging: Persistent tracking of all system actions for compliance.

[x] Phase 6: Visual Reporting: Terminal dashboard with tabular data display.