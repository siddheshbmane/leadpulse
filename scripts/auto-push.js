#!/usr/bin/env node
/**
 * AUTO-PUSH SCRIPT
 * This script ensures every code change is automatically committed and pushed to GitHub.
 */
const { execSync } = require('child_process');

function autoPush(message = "Automated sync: LeadPulse infrastructure/code update") {
  try {
    process.chdir('/data/.openclaw/workspace/leadpulse');
    
    // Check for changes
    const status = execSync('git status --porcelain').toString();
    if (!status) {
      console.log("No changes to push.");
      return;
    }

    console.log("Detected changes. Synchronizing with GitHub...");
    execSync('git add .');
    execSync(`git commit -m "${message}"`);
    execSync('git push origin main'); // Assuming main branch
    console.log("✅ Successfully pushed to GitHub.");
  } catch (error) {
    console.error("❌ Auto-push failed:", error.message);
  }
}

// Run immediately if called directly
if (require.main === module) {
  autoPush(process.argv[2]);
}

module.exports = autoPush;
