# Learning Management System Server

### Dependencies Installed

```bash
npm install bcryptjs cloudinary cookie-parser cors dotenv express jsonwebtoken mongoose morgan multer nodemailer razorpay
```

```bash
npm install -D nodemon
```

## Basic Express App Setup

`app.js`

```javascript
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
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

// routes of 3 modules

app.use("*", (req, res) => {
  res.send(`<h1>404! Page Not Found</h1>`);
  res.status(404);
});

export default app;
```

`server.js`

```javascript
import app from "./app.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT}`);
});
```
