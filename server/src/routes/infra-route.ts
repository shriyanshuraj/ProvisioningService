import { Router } from "express";
import { deleteFrontendInfra, frontendInfra, getHealth } from "../controller/infra-controller"

const infraRouter = Router();

infraRouter.get("/health", getHealth);
infraRouter.post("/frontend", frontendInfra);
infraRouter.delete("/frontend", deleteFrontendInfra);
infraRouter.post("/backend");

export default infraRouter;
