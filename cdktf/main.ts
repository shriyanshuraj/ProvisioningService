import { App } from "cdktf";
import { FrontendStack } from "./stacks/frontend";

const appName = process.env.APP_NAME;
const envName = process.env.ENV_NAME;

if (!appName || !envName) {
  throw new Error("APP_NAME and ENV_NAME are required!");
}

const app = new App();
new FrontendStack(app, `FrontendStack-${appName}-${envName}`, appName, envName);
app.synth();

