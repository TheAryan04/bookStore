import express from "express";
import "dotenv/config";
import cors from "cors";
import multer from "multer";

import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import { connectDB } from "./lib/db.js";
import job from "./lib/cron.js";


const app = express();
const PORT = process.env.PORT;
const upload = multer({ storage: multer.memoryStorage() });

job.start(); // Start the cron job to send GET requests every 14 minutes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(upload.single("image"));

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
