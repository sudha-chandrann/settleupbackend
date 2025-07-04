import { Router } from "express";
import { loginUser, registerUser } from "../controller/user.controller.js";
import { sendSuccessResponse } from "../utils/index.js";
const router = Router();
router.route("/auth/register").post(registerUser);
router.route("/auth/login").post(loginUser);
router.route("/").get(async(req, res) => {
  try {
    return sendSuccessResponse(res, 200, "hello");
  } catch (error) {}
});
export default router;
