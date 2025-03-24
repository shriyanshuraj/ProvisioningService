import { Request, Response } from "express";
import { spawn } from "child_process";
import path from "path";


export async function getHealth(req: Request, res: Response) {
  try {
    res.status(200).json({
      status: "Healthy",
    });
  } catch (error) {
    res.status(500).json({
      status: "Unhealthy",
    });
  }
}

export async function frontendInfra(req: Request, res: Response): Promise<void> {
  const { appName, envName } = req.body;

  if (!appName || !envName) {
    res.status(400).json({ error: "appName and envName are required" });
    return;
  }

  console.log(`Starting frontend infrastructure deployment for ${appName}-${envName}...`);

  const cdktfPath = path.resolve(__dirname, "../../../cdktf");

  // Run cdktf synth and deploy using child process
  const deployProcess = spawn("npx", ["cdktf", "deploy", "--auto-approve"], {
    cwd: cdktfPath,
    stdio: ["inherit", "inherit", "inherit"],
    env: {
      ...process.env,
      APP_NAME: appName,
      ENV_NAME: envName,
    },
  });

  deployProcess.on("close", (code) => {
    if (code === 0) {
      console.log(`Frontend infrastructure deployed for ${appName}-${envName}`);
      res.status(201).json({ message: `Frontend deployed for ${appName}-${envName}` });
    } else {
      console.error(`Deployment failed with code ${code}`);
      res.status(500).json({ error: `Deployment failed with code ${code}` });
    }
  });

  deployProcess.on("error", (error) => {
    console.error("Error during deployment:", error);
    res.status(500).json({ error: error.message });
  });
}

export async function deleteFrontendInfra(req: Request, res: Response){
  res.status(200).json({
    message: "Delete frontend infra",
  });
}