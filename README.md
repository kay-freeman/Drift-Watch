# DriftWatch

DriftWatch is a configuration auditing tool designed to detect and automatically remediate discrepancies between defined infrastructure policies and live environment states.

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
```bash
npm install