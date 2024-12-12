import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import router from "./routes/user.routes";
import { config } from "dotenv";
config();

const app = express();

// Built-In
app.use(express.json());

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

// Default Route for 404 Error
app.all("*", (req, res) => {
  res.send(`<h1>OOPS!! 404 Page Not Found</h1>`);
  res.status(404);
});

// Custom error handling middleware
app.use(errorMiddleware);

export default app;
