//Creating an express router for the task routes
import { Router, Response } from "express";
import { auth, AuthRequest } from "../middleware/auth";
import { NewTask, tasks } from "../db/schema";
import { db } from "../db";
import { eq, and } from "drizzle-orm";

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


//create the route which handles the update route for a task
// Replace the duplicate PATCH routes with this single PUT route
taskRouter.patch("/:taskId", auth, async (req: AuthRequest, res): Promise<void> => {
    try {
        const { taskId } = req.params;
        const { title, description, hexColor, tag, dueAt, priority, completed } = req.body as CreateTaskBody;

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(taskId)) {
            res.status(400).json({ error: "Invalid task ID format" });
            return;
        }

        // First check if the task exists
        const existingTask = await db
            .select()
            .from(tasks)
            .where(
                and(
                    eq(tasks.id, taskId as string),
                    eq(tasks.uid, req.user!)
                )
            );

        if (!existingTask.length) {
            res.status(404).json({
                error: "Task not found or unauthorized",
                taskId,
                userId: req.user
            });
            return;
        }

        // Update the task
        const [updatedTask] = await db
            .update(tasks)
            .set({
                title,
                description,
                hexColor,
                tag,
                priority: priority.toString(),
                dueAt: dueAt ? new Date(dueAt) : undefined,
                completed,
                updated_at: new Date() // Update the updated_at timestamp
            })
            .where(
                and(
                    eq(tasks.id, taskId as string),
                    eq(tasks.uid, req.user!)
                )
            )
            .returning();

        if (!updatedTask) {
            res.status(404).json({ error: "Failed to update task" });
            return;
        }

        res.json(updatedTask);
    } catch (err) {
        console.error('Update task error:', err);
        if (err instanceof Error) {
            res.status(500).json({
                error: err.toString(),
                taskId: req.params.taskId
            });
        } else {
            res.status(500).json({
                error: "Unknown error",
                taskId: req.params.taskId
            });
        }
    }
});


export default taskRouter;