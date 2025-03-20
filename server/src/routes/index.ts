import { Router } from "express";
import infraRouter from "./infra-route";

const rootRouter = Router();

rootRouter.use("/v1/infra", infraRouter);

export default rootRouter;
