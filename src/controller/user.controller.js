import { User } from "../model/user.model.js";
import dotenv from "dotenv";
import { sendVerifyEmail } from "../utils/sendVerifyEmail.js";
import { sendErrorResponse, sendSuccessResponse } from "../utils/index.js";
import Joi from "joi";
dotenv.config();

const registerValidation = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name cannot exceed 50 characters",
    "any.required": "Name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters long",
    "any.required": "Password is required",
  }),
});

const loginValidation = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

const registerUser = async (req, res) => {
  try {
    const { error, value } = registerValidation.validate(req.body);
    if (error) {
      return sendErrorResponse(res, 400, "Validation failed", error.details);
    }
    const { name, email, password } = value;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return sendErrorResponse(
          res,
          409,
          "User already exists with this email"
        );
      }
      await User.deleteOne({ _id: existingUser._id });
    }

    const newUser = await User.create({
      name,
      password,
      email,
    });

    if (!newUser) {
      return sendErrorResponse(res, 409, "Failed to create user account");
    }
    return sendSuccessResponse(res, 201, "User registered successfully");
  } catch (error) {
    console.error("Registration error:", error);
    if (error.code === 11000) {
      return sendErrorResponse(res, 409, "User already exists with this email");
    }
    return sendErrorResponse(
      res,
      500,
      error.message || "Internal server error"
    );
  }
};

const loginUser = async (req, res) => {
  try {
    const { error, value } = loginValidation.validate(req.body);
    if (error) {
      return sendErrorResponse(res, 400, "Validation failed", error.details);
    }

    const { email, password } = value;

    const user = await User.findOne({ email });
    if (!user) {
      return sendErrorResponse(res, 401, "Invalid email or password");
    }
    if (!user.isEmailVerified) {
      return sendErrorResponse(
        res,
        401,
        "Email verification is required to proceed."
      );
    }

    const isValidPassword = await user.isPasswordCorrect(password);
    if (!isValidPassword) {
      return sendErrorResponse(res, 401, "Invalid email or password");
    }

    const refreshToken = user.generateRefreshToken();

    return sendSuccessResponse(res, 200, "Login successful", {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar,
      },
      token: refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    return sendErrorResponse(
      res,
      500,
      error.message || "Internal server error"
    );
  }
};

const sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendErrorResponse(res, 400, "Email is required.");
    }

    const user = await User.findOne({ email });
    if (!user) {
      return sendErrorResponse(res, 404, "No account found with the provided email.");
    }

    if (user.isEmailVerified) {
      return sendErrorResponse(res, 400, "This email is already verified.");
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 3 * 60 * 1000);

    user.verificationCode = code;
    user.verificationCodeExpires = expiry;
    await user.save();

    await sendVerifyEmail(email, code);

    return sendSuccessResponse(res, 200, "A verification code has been sent to your email.");
  } catch (error) {
    console.error("Error sending verification code:", error);
    return sendErrorResponse(
      res,
      500,
      "An unexpected error occurred while sending the verification code. Please try again later."
    );
  }
};


const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return sendErrorResponse(res, 400, "Both email and verification code are required.");
    }

    const user = await User.findOne({ email });
    if (!user) {
      return sendErrorResponse(res, 404, "No account found with the provided email.");
    }

    if (user.isEmailVerified) {
      return sendErrorResponse(res, 400, "This email is already verified.");
    }

    if (!user.verificationCode || new Date() > user.verificationCodeExpires) {
      return sendErrorResponse(res, 400, "The verification code has expired. Please request a new one.");
    }

    if (user.verificationCode !== code) {
      return sendErrorResponse(res, 401, "The verification code you entered is invalid.");
    }

    user.isEmailVerified = true;
    user.verificationCode = "";
    user.verificationCodeExpires = null;
    await user.save();

    return sendSuccessResponse(res, 200, "Your email has been verified successfully.");
  } catch (error) {
    console.error("Email verification error:", error);
    return sendErrorResponse(
      res,
      500,
      "An unexpected error occurred during email verification. Please try again later."
    );
  }
};


const logout = async (req, res) => {
  try {
    const _id = req.user._id;
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    };

    return res.clearCookie("token", cookieOptions).status(200).json({
      message: "Logged out successfully",
      success: true,
      status: 200,
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      message: "Logout failed",
      success: false,
      status: 500,
    });
  }
};

const getcurrentUser = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(404).json({
        message: "unauthorized",
        success: false,
        status: 404,
      });
    }
    const user = await User.findById(userId).select(
      "-password -verficationCode -verficationCodeExpires"
    );
    if (!user) {
      return res.status(404).json({
        message: "User not found with this email",
        success: false,
        status: 404,
      });
    }

    return res.status(200).json({
      message: "user is found successfully",
      success: true,
      status: 200,
      user: user,
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      message: "Logout failed",
      success: false,
      status: 500,
    });
  }
};

export {
  registerUser,
  loginUser,
  sendVerificationCode,
  verifyEmail,
  logout,
  getcurrentUser,
};
