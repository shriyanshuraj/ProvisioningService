import { spawn } from "child_process";

async function deployFrontend(appName, envName) {
  console.log(
    `Deploying frontend infrastructure for ${appName}-${envName} using CDKTF...`
  );

  const deployProcess = spawn(
    "cdktf",
    ["deploy", `FrontendStack`, "--auto-approve"],
    {
      stdio: ["inherit", "inherit", "inherit"], // Pipe output directly
    }
  );

  deployProcess.on("close", (code) => {
    if (code === 0) {
      console.log(`Frontend infrastructure deployed for ${appName}-${envName}`);
      process.exit(0);
    } else {
      console.error(`Deployment failed with code ${code}`);
      process.exit(1);
    }
  });

  deployProcess.on("error", (error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });
}

// Read appName and envName from command-line arguments
const [appName, envName] = process.argv.slice(2);

if (!appName || !envName) {
  console.error("appName and envName are required");
  process.exit(1);
}

deployFrontend(appName, envName);
