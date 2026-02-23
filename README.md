# DriftWatch

DriftWatch is a configuration auditing tool designed to detect discrepancies between defined infrastructure policies and live environment states. It provides a programmatic way to enforce infrastructure standards and maintain visibility into configuration drift.

## Problem Statement
In production environments, manual changes—often referred to as "hotfixes"—are frequently applied directly to resources without being reflected in the version-controlled configuration. This leads to configuration drift, making infrastructure difficult to replicate, audit, and secure.

## Current Functionality
- **Policy as Code**: Infrastructure requirements are defined using standardized YAML syntax.
- **Schema Enforcement**: Utilizes Zod for strict type validation of ports and protocols.
- **Drift Detection**: Compares the "Desired State" (YAML) against the "Live State" (JSON) to identify unauthorized modifications.
- **Version Control**: Integrated with Git to provide a clear audit trail of policy changes.

## Technical Stack
- Language: TypeScript
- Validation Framework: Zod
- Configuration Format: YAML / JSON
- Runtime: Node.js

## Getting Started

### 1. Installation
Install the necessary dependencies:
```bash
npm install