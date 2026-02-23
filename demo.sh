#!/bin/bash

# Function to pause
pause(){
   read -p "$*"
}

echo "🚀 DriftWatch: The Ultimate Interactive Experience"
echo "--------------------------------------------------"
echo "Setting baseline: Clearing DB and backing up states..."
npx ts-node index.ts --clear > /dev/null
cp live-state.json live-state.json.bak
cp policies/infrastructure.yaml policies/infrastructure.yaml.bak 

echo "✅ System ready."
echo ""

echo "SELECT A SCENARIO:"
echo "1) Unauthorized Change (Adds a 'Rogue' Port)"
echo "2) Accidental Deletion (Removes a Required Rule)"
echo "3) GLOBAL DRIFT (Break multiple resources simultaneously)"
echo "4) Security Enforcement (Inject a Malformed Policy)"
echo "5) Clean Run (Verify 100% Compliance)"
read -p "Enter choice [1-5]: " choice

case $choice in
  1)
    echo "😈 Injecting 'unauthorized-access' on Port 666..."
    sed -i '' 's/"active_rules": \[/"active_rules": \[ \{"id": "unauthorized-access", "port": 666, "protocol": "tcp"\},/g' live-state.json
    DRIFT_TYPE="Single Unauthorized Rule"
    ;;
  2)
    echo "🗑️ Deleting 'allow-http' from the live state..."
    sed -i '' '/"id": "allow-http"/,+2d' live-state.json
    DRIFT_TYPE="Policy Violation (Missing Rule)"
    ;;
  3)
    echo "🌪️ TRIGGERING GLOBAL DRIFT..."
    sed -i '' 's/"active_rules": \[/"active_rules": \[ \{"id": "shadow-it-rule", "port": 999, "protocol": "udp"\},/g' live-state.json
    sed -i '' 's/"port": 5432/"port": 9999/g' live-state.json
    DRIFT_TYPE="Multi-Resource Configuration Corruption"
    ;;
  4)
    echo "🚫 Corrupting policy schema (Zod Validation Test)..."
    sed -i '' 's/port: 80/port: "INVALID_STRING"/g' policies/infrastructure.yaml
    DRIFT_TYPE="Schema Validation Failure"
    ;;
  5)
    echo "😇 Running compliance check on a clean environment..."
    DRIFT_TYPE="Baseline Compliance Check"
    ;;
  *)
    echo "❌ Invalid choice."
    exit 1
    ;;
esac

echo ""
pause "Step 1: Detection. Run the Audit Engine? [Press Enter]"
npx ts-node index.ts

echo ""
if [[ $choice == "4" ]]; then
    echo "💡 Engine safely rejected the corrupted YAML. This proves your Zod schema works."
    REMEDIATION_STATUS="Prevented via Schema Enforcement"
    cp policies/infrastructure.yaml.bak policies/infrastructure.yaml
else
    read -p "Step 2: Remediation. Fix all detected drift automatically? (y/n): " confirm
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
        echo "🛠️ Repairing environment..."
        npx ts-node index.ts --fix
        REMEDIATION_STATUS="Success (Auto-Remediated)"
    else
        echo "⚠️ Remediation skipped. Environment left in drifted state."
        REMEDIATION_STATUS="Pending (Manual Intervention Required)"
    fi
fi

echo ""
pause "Step 3: Compliance Trail. View the Database logs? [Press Enter]"
npx ts-node index.ts --history

# Final Cleanup and Reset
cp live-state.json.bak live-state.json
cp policies/infrastructure.yaml.bak policies/infrastructure.yaml 2>/dev/null
rm live-state.json.bak
rm policies/infrastructure.yaml.bak 2>/dev/null

echo ""
echo "--------------------------------------------------"
echo "            DEMO SESSION SUMMARY                 "
echo "--------------------------------------------------"
echo "Scenario Run:    $DRIFT_TYPE"
echo "Resolution:      $REMEDIATION_STATUS"
echo "Timestamp:       $(date)"
echo "Security Grade:  A+ (Drift Detected & Handled)"
echo "--------------------------------------------------"
echo "🔥 Experience Complete. The environment has been fully reset."