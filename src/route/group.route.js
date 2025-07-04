import { Router } from "express";
import { createGroup } from "../controller/group.controller.js";
import {authenticateToken} from "../middleware/auth.middleware.js"
const router = Router();
router.route("/createGroup").post(authenticateToken,createGroup);
export default router;
