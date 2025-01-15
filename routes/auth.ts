import e, { Router, Request, Response } from 'express';
import { db } from '../db';
import { NewUser, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { auth, AuthRequest } from '../middleware/auth';

//creates a router instance
const authRouter = Router();

interface SignUpBody {
    name: string;
    email: string;
    password: string;
}

interface LoginBody {
    email: string;
    password: string;
}


//signup route
//First parameter explains the if the route is dynamic or not
//Second parameter is the Query parameters
//Third parameter is the request body
authRouter.post("/signup", async (req: Request<{}, {}, SignUpBody>, res: Response) => {
    try {
        //*USE_CASE
        //get request body
        const { name, email, password } = req.body;

        //check if the user already exists
        //``  Possible chance of improve as the database will be read whole 
        //``  just to check if the user exists
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, email));

        if (existingUser.length) {
            res.status(400)
                .json({ error: "User already exists" });
            return;
        }

        //hash the password
        const hashedPassword = await bcryptjs.hash(password, 8);

        //create a new user and store in db
        const newuser: NewUser = {
            name: name,
            email: email,
            password: hashedPassword
        }

        //insert the new user data into user table
        const [user] = await db.insert(users).values(newuser).returning();


        //return the user data with success status
        res.status(201).json(user);


    } catch (error) {
        if (error instanceof Error) {
            res.status(500).send(error.message);
        } else {
            res.status(500).send("An unknown error occurred");
        }
    }
});


authRouter.post("/login", async (req: Request<{}, {}, LoginBody>, res: Response) => {
    try {
        //*USE_CASE
        //get request body
        const { email, password } = req.body;

        //check if the user already exists
        //``  Possible chance of improve as the database will be read whole 
        //``  just to check if the user exists
        const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, email));

        if (!existingUser) {
            res.status(400)
                .json({ error: "User with this email doesn't exist." });
            return;
        }

        //hash the password
        const isMatch = await bcryptjs.compare(password, existingUser.password);
        //IF PASSWORD DOESN'T MATCH
        if (!isMatch) {
            res.status(400).json({ error: "Invalid credentials" });
            return;
        }

        const token = jwt.sign({ id: existingUser.id }, "passwordKey")

        //return the user data with success status [Login successfull]
        res.json({ token, ...existingUser });


    } catch (error) {
        if (error instanceof Error) {
            res.status(500).send(error.message);
        } else {
            res.status(500).json(false);
        }
    }
});

//This route is used to check if the token is valid
authRouter.post("/token_is_valid", async (req, res) => {
    try {
        //get the header
        const token = req.header("x-auth-token");
        if (!token) {
            res.json(false);
            return;
        }
        //verify the token
        const verified = jwt.verify(token, "passwordKey");
        if (!verified) {
            res.json(false);
            return;
        }
        // get the user data if the token is valid
        const verifiedToken = verified as { id: string };
        const [user] = await db.select().from(users).where(eq(users.id, verifiedToken.id));

        if (!user) {
            res.json(false);
            return;
        }
        res.json(true);
        // return false, if no user found
    } catch (err) {
        res.status(500).send("An unknown error occurred");
    }
});

//This is the root route for auth
authRouter.get("/", auth, async (req: AuthRequest, res) => {
    try {
        // Check if the user is present in the request object
        if (!req.user) {
            res.status(401).json({ error: "User not Found" });
            return;
        }
        // Query the database for the user
        const [user] = await db.select().from(users).where(eq(users.id, req.user));
        // Send the user data along with the token
        res.json({ ...user, token: req.token });
    } catch (err) {
        res.status(500).send("An unknown error occurred");
    }
});

// Exports the authRouter for use in other parts of the application
export default authRouter;