import { Router } from "express";
import { loginUser, registerUser, sendVerificationCode, verifyEmail } from "../controller/user.controller.js";
const router = Router();
router.route("/auth/register").post(registerUser);
router.route("/auth/login").post(loginUser);
router.route("/auth/send-verification-code").post(sendVerificationCode);
router.route("/auth/verify-email").post(verifyEmail);
export default router;
