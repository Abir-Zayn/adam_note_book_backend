import { NextFunction, Request, Response } from 'express';
import { UUID } from "crypto";
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

//Purpose : This middleware authenticates requests by verifying JWT tokens 
//  and attaching user information to the request object.

export interface AuthRequest extends Request {
    user?: UUID;
    token?: string;
}

export const auth = async (req: AuthRequest,
    res: Response, next: NextFunction) => {
    try {
        //get the header
        const token = req.header("x-auth-token");
        if (!token) {
            res.status(401).json({ error: "No auth token, Access Denied" });
            return;
        }
        //verify the token
        const verified = jwt.verify(token, "passwordKey");
        if (!verified) {
            res.status(401).json({ error: "Token verification failed" });
            return;
        }
        // get the user data if the token is valid
        const verifiedToken = verified as { id: UUID };
        const [user] = await db.select().from(users).where(eq(users.id, verifiedToken.id));

        if (!user) {
            res.json(401).json({ error: "No user found" });
            return;
        }

        req.user = verifiedToken.id;
        req.token = token;
        next();
        // return false, if no user found
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json({ error: err.toString() });
        } else {
            res.status(500).json({ error: "Unknown error" });
        }
    }
}