// middlewares/authMiddleware.js
import { verifyToken } from './jwtService.js';

export const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // "Bearer <token>"
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }

  req.user = decoded; // Attach decoded user data
  next();
};
