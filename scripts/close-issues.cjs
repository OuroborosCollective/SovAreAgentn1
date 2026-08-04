const { Octokit } = require("octokit");
const fs = require("fs");

async function main() {
    const token = process.env.N1_SYNC_TOKEN || process.env.GITHUB_TOKEN;
    if (!token) {
       console.log("No token provided. Please run this script with N1_SYNC_TOKEN or GITHUB_TOKEN set.");
       return;
    }
    
    const octokit = new Octokit({ auth: token });
    const owner = "OuroborosCollective";
    const repo = "SovAreAgentn1";
    
    // Close issues 4 to 19
    for (let i = 4; i <= 19; i++) {
        try {
            await octokit.rest.issues.update({
                owner,
                repo,
                issue_number: i,
                state: "closed"
            });
            console.log(`Successfully closed issue #${i}`);
        } catch(e) {
            console.log(`Failed to close issue #${i}:`, e.message);
        }
    }
}
main();
