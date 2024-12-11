import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

app.use(express.json());

app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    credentials: true,
  })
);

app.use(cookieParser());

app.use("/ping", (req, res) => {
  res.send("<h1>Pong</h1>");
});

// routes of 3 modules

app.use("*", (req, res) => {
  res.send(`<h1>404! Page Not Found</h1>`);
  res.status(404);
});

export default app;
