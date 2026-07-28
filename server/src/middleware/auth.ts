import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { User, IUser } from "../models/User";
import type { UserRole } from "@therapist/shared";

export interface AuthRequest extends Request {
  user?: IUser;
}

interface TokenPayload {
  userId: string;
  role: UserRole;
}

export function signAccessToken(user: IUser): string {
  return jwt.sign({ userId: user._id.toString(), role: user.role }, config.jwtSecret, {
    expiresIn: "15m",
  });
}

export function signRefreshToken(user: IUser): string {
  return jwt.sign({ userId: user._id.toString(), role: user.role }, config.jwtRefreshSecret, {
    expiresIn: "7d",
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtRefreshSecret) as TokenPayload;
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

export function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    next();
    return;
  }

  User.findById(verifyAccessToken(token).userId)
    .then((user) => {
      if (user) req.user = user;
      next();
    })
    .catch(() => next());
}
