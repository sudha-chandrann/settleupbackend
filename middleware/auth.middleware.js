import { User } from "../src/model/user.model.js";
import { sendErrorResponse } from "../src/utils.js";
import jwt from "jsonwebtoken";

export default  authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return sendErrorResponse(res, 401, 'Access token required');
    }

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || 'fallback_secret_key');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user|| !user.isEmailVerified) {
      return sendErrorResponse(res, 401, 'Invalid token or user not found');
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return sendErrorResponse(res, 401, error.message||'Invalid or expired token');
  }
};