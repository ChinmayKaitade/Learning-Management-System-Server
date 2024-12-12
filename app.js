import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import router from "./routes/user.routes";
import { config } from "dotenv";
config();

const app = express();

app.use(express.json());

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

app.get("/ping", (req, res) => {
  res.send("<h1>Pong</h1>");
});

// routes
app.use("/api/v1/user", userRoutes);

app.all("*", (req, res) => {
  res.send(`<h1>404! Page Not Found</h1>`);
  res.status(404);
});

export default app;
