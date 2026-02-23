import fs from 'fs';
import YAML from 'yaml';
import { z } from 'zod';

// 1. This is our "Safety Inspector" (Schema)
const RuleSchema = z.object({
  id: z.string(),
  port: z.number(),
  protocol: z.string()
});

const InfrastructureSchema = z.object({
  resource_name: z.string(),
  rules: z.array(RuleSchema)
});

// 2. This function reads the file you just saved
function checkInfrastructure() {
  // Read the physical file
  const fileContents = fs.readFileSync('./infrastructure.yaml', 'utf8');
  
  // Convert YAML text into a Javascript Object
  const data = YAML.parse(fileContents);
  
  // Validate the data
  const validated = InfrastructureSchema.parse(data);
  
  console.log("✅ Audit Complete: The 'Desired State' is valid.");
  console.log(`Checking resource: ${validated.resource_name}`);
}

checkInfrastructure();