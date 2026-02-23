# DriftWatch

DriftWatch is a configuration auditing tool designed to detect and automatically remediate discrepancies between defined infrastructure policies and live environment states.

## Problem Statement
In production environments, manual changes frequently referred to as "hotfixes" are often applied directly to resources without being reflected in the version-controlled configuration. This leads to configuration drift, making infrastructure difficult to replicate, audit, and secure.

## Current Functionality
* **Policy as Code**: Infrastructure requirements are defined using standardized YAML syntax.
* **Schema Enforcement**: Utilizes Zod for strict type validation of ports and protocols.
* **Drift Detection**: Real-time comparison between Desired vs. Live state.
* **Dry Run Mode**: Ability to audit and report drift without applying changes.
* **Auto-Remediation**: Optional synchronization to remove unauthorized rules and restore policy.
* **Audit Logging**: Maintains a persistent `audit.log` file for historical compliance tracking.

## Technical Stack
* **Language**: TypeScript
* **Validation Framework**: Zod
* **Configuration Format**: YAML (Policy) / JSON (Live State)
* **Runtime**: Node.js

## Getting Started

### 1. Installation
Install the necessary dependencies:
```bash
npm install