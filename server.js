import app from "./app.js";

import { config } from "dotenv";
config();

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("<h1>Hello World!</h1>");
});

app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT}`);
});
