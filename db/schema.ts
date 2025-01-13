import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";

// Function to calculate default due date (7 days from now)
function defaultDueAt(): Date {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

//Context >> Define user table schema using Drizzle ORM
export const users = pgTable(
    "users",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        name: text("name").notNull(),
        email: text("email").notNull().unique(),
        password: text("password").notNull(),
        created_at: timestamp("created_at").defaultNow(),
        updated_at: timestamp("updated_at").defaultNow(),

    }
);
// TypeScript type for selecting users (includes all columns)
export type User = typeof users.$inferSelect;

// TypeScript type for inserting new users (optional timestamps)
export type NewUser = typeof users.$inferInsert;

export const tasks = pgTable(
    "tasks",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        title: text("title").notNull(),
        description: text("description").notNull(),
        hexColor: text("hexColor").notNull(),
        tag: text("tag").notNull(),
        completed: boolean("completed").default(false),
        dueAt: timestamp("dueAt").defaultNow(),
        uid: uuid("uid").notNull().references(() => users.id),
        priority: text("priority").notNull().default("1"), // 1 = low, 2 = medium, 3 = high, 4 = urgent
        created_at: timestamp("created_at").defaultNow(),
        updated_at: timestamp("updated_at").defaultNow(),
    }
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;