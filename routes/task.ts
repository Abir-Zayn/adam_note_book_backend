//Creating an express router for the task routes
import { Router } from "express";
import { auth, AuthRequest } from "../middleware/auth";
import { NewTask, tasks } from "../db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

const taskRouter = Router();

//Defines the expected structure for creating a new task
interface CreateTaskBody {
    title: string;
    description: string;
    hexColor: string;
    tag: string;
    dueAt?: string;
    completed?: boolean;
    priority: number;
}

//Create a new task [post route]
taskRouter.post("/", auth, async (req: AuthRequest, res) => {

    //Destructures request body into task properties
    //  Begins constructing a new task object according to the NewTask schema type
    try {
        const { title, description, hexColor, tag, dueAt, priority, completed } = req.body as CreateTaskBody;

        const newTask: NewTask = {
            title,
            description,
            hexColor,  // Include hexColor
            tag,
            priority: priority.toString(),
            dueAt: dueAt ? new Date(dueAt) : new Date(),
            completed: completed || false,
            uid: req.user!
        };
        const [task] = await db.insert(tasks).values(newTask).returning();
        res.status(201).json(task);

    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json({ error: err.toString() });
        } else {
            res.status(500).json({ error: "Unknown error" });
        }
    }
});


taskRouter.get("/", auth, async (req: AuthRequest, res) => {
    try {
        const allTasks = await db
            .select()
            .from(tasks)
            .where(eq(tasks.uid, req.user!));

        res.json(allTasks);
    } catch (e) {
        res.status(500).json({ error: e });
    }
});

taskRouter.delete("/:taskId", auth, async (req: AuthRequest, res) => {
    try {
        const { taskId } = req.params;
        await db.delete(tasks).where(eq(tasks.id, taskId));

        res.json(true);
    } catch (e) {
        res.status(500).json({ error: e });
    }
});

taskRouter.patch("/:taskId", auth, async (req: AuthRequest, res) => {
    try {
        const { taskId } = req.params;
        const { completed } = req.body;;

        const [updatedTask] = await db
            .update(tasks)
            .set({ completed })
            .where(eq(tasks.id, taskId))
            .returning();

        if (!updatedTask) {
            res.status(404).json({ error: "Task not found" });
            return;
        }

        res.json(updatedTask);
    } catch (e) {
        res.status(500).json({ error: e });
    }
});

//update the task



export default taskRouter;