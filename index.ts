import express from 'express';
import authRouter from './routes/auth';
import taskRouter from './routes/task';

//Context >> Sets up PostgreSQL connection pool using pg and initializes Drizzle ORM.

//Creates an Express application instance (app).
const app = express();

//Configures the app to parse JSON request
app.use(express.json());

app.use("/auth", authRouter);
app.use("/task", taskRouter);

//This is the root route
app.get('/', (req, res) => {
    res.send('Hello Welcome to Adam!');
});

// Starts the server on port 8000 and 
// logs a message when the server is running
app.listen(8000, () => {
    console.log("Server started on port 8000")
});