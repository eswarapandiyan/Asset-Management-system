// services/jwtService.js
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1h'; // token expiry

console.log('JWT_SECRET',process.env.JWT_SECRET);

// Generate JWT
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

// Verify JWT
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};
