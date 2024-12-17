import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes.js";
import courseRoutes from "./routes/course.routes.js";
import morgan from "morgan";
import { config } from "dotenv";
import errorMiddleware from "./middlewares/error.middleware.js";
config();

const app = express();

// Built-In
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded data from incoming requests

// Third-Party
app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    credentials: true,
  })
);

app.use(cookieParser());

app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("<h1>Hello World</h1>");
});

// Server Status Check Route
app.get("/ping", (req, res) => {
  res.send("<h1>Pong</h1>");
});

// routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/courses", courseRoutes);

// Default Route for 404 Error
app.all("*", (req, res) => {
  res.send(`<h1>OOPS!! 404 Page Not Found</h1>`);
  res.status(404);
});

// Custom error handling middleware
app.use(errorMiddleware);

export default app;
