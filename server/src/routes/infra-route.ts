import { Router } from "express";
import { frontendInfra, getHealth } from "../controller/infra-controller"

const infraRouter = Router();

infraRouter.get("/health", getHealth);
infraRouter.post("/frontend", frontendInfra);
infraRouter.post("/backend");

export default infraRouter;
