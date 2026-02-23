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
* Auto Remediation: Programmatic synchronization to restore policy state.
* Audit Logging: Maintains a persistent audit.log for historical compliance tracking.

## Technical Stack
* Language: TypeScript
* Validation Framework: Zod
* Configuration Format: YAML (Policy) / JSON (Live State)
* Runtime: Node.js

## Getting Started

### 1. Installation
Install the necessary dependencies to handle YAML parsing and TypeScript execution:

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

**live-state.json** (The Simulated Reality)

    {
      "production-db-firewall": {
        "active_rules": [
          { "id": "web-to-db", "port": 5432, "protocol": "tcp" },
          { "id": "unauthorized-access", "port": 9999, "protocol": "tcp" }
        ]
      }
    }

### 3. Usage

Manual Audit (Dry Run):
    npx ts-node index.ts

Manual Fix (Remediation):
    npx ts-node index.ts --fix

Autopilot Mode (Continuous Monitoring):
    ./watch.sh

## Schema Definition
All policies must follow this structure:
* resource_name: Unique identifier (matches live-state.json keys).
* rules: List of objects containing id, port, and protocol (tcp, udp, or icmp).

## Project Roadmap

* [x] Phase 1: Policy Validation: Ensure YAML configurations are schema compliant.
* [x] Phase 2: State Simulation: Created mock data for live environment testing.
* [x] Phase 3: Drift Detection: Logic implemented to flag discrepancies.
* [x] Phase 4: Auto Remediation: Support for automated fixes with CLI flag control.
* [x] Phase 5: Audit Logging: Persistent tracking of all system actions for compliance.
* [x] Phase 6: Visual Reporting: Terminal dashboard with tabular data display.
* [x] Phase 7: Multi Policy Support: Refactored engine to process entire directories.
* [x] Phase 8: Milestone: Commit stable multi resource engine to version control.
* [x] Phase 9: Bidirectional Detection: Logic added to find both extra and missing rules.
* [x] Phase 10: Automation Script: Created shell wrapper for continuous interval auditing.