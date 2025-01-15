import { NextFunction, Request, Response } from 'express';
import { UUID } from "crypto";
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
    user?: UUID;
    token?: string;
}

export const auth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        console.log('Auth middleware started');
        const token = req.header("x-auth-token");

        if (!token) {
            console.log('No token provided');
            res.status(401).json({ error: "No auth token, Access Denied" });
            return;
        }

        console.log('Token received, verifying...');
        const verified = jwt.verify(token, process.env.JWT_SECRET || "passwordKey");

        if (!verified) {
            console.log('Token verification failed');
            res.status(401).json({ error: "Token verification failed" });
            return;
        }

        console.log('Token verified, checking user...');
        const verifiedToken = verified as { id: UUID };

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, verifiedToken.id));

        if (!user) {
            console.log('No user found for token');
            res.status(401).json({ error: "No user found" });
            return;
        }

        console.log('User found, proceeding...');
        req.user = verifiedToken.id;
        req.token = token;
        next();

    } catch (err) {
        console.error('Auth middleware error:', err);
        if (err instanceof Error) {
            res.status(500).json({
                error: err.toString(),
                details: err.message
            });
            return;
        } else {
            res.status(500).json({ error: "Unknown error" });
            return;
        }
    }
};