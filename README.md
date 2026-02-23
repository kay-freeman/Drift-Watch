# DriftWatch

**DriftWatch** is a Site Reliability Engineering (SRE) tool designed to detect "Configuration Drift" in infrastructure. It ensures that the live state of a system matches the defined "Source of Truth" in version control.

## 🚀 The Problem
In production environments, manual changes (hotfixes) often happen directly on servers or cloud consoles. These changes are rarely back-ported to code, leading to "Drift." This makes infrastructure brittle and prone to security vulnerabilities.

## 🛠️ Current Features
- **Policy as Code:** Infrastructure requirements defined in YAML.
- **Strict Validation:** Uses `Zod` to ensure data integrity.
- **Version Control:** Fully tracked via GitHub.

## 🏗️ Tech Stack
- **Language:** TypeScript
- **Validation:** Zod
- **Config:** YAML
- **Runtime:** Node.js

## 🚦 How to Run
1. Install dependencies: `npm install`
2. Run the validator: `npx ts-node index.ts`