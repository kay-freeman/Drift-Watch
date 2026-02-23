import fs from 'fs';
import YAML from 'yaml';
import { z } from 'zod';

// 1. The Safety Inspector (Schema)
const RuleSchema = z.object({
  id: z.string(),
  port: z.number(),
  protocol: z.string()
});

const InfrastructureSchema = z.object({
  resource_name: z.string(),
  rules: z.array(RuleSchema)
});

// 2. The Logic to read and check the file
function checkInfrastructure() {
  try {
    // Read the actual file
    const fileContents = fs.readFileSync('./infrastructure.yaml', 'utf8');
    
    // Convert YAML text to a JS Object
    const data = YAML.parse(fileContents);
    
    // Validate the data against our rules
    const validated = InfrastructureSchema.parse(data);
    
    console.log("✅ Audit Complete: The 'Desired State' is valid.");
    console.log(`Checking resource: ${validated.resource_name}`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Audit Failed! Structure mismatch:");
      console.error(error.errors.map(e => ` - ${e.path.join('.')}: ${e.message}`).join('\n'));
    } else {
      console.error("❌ Audit Failed! An unexpected error occurred:");
      console.error(error);
    }
  }
}

checkInfrastructure();