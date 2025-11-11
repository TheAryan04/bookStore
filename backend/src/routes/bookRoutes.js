import express from "express";
import { createBookPost, deleteBookPost, getAllBooks, recommendedBooks } from "../controllers/bookControllers.js";
import protectRoute from "../middleware/auth_middleware.js";

const router = express.Router();

router.post("/", protectRoute, createBookPost);
router.get("/", protectRoute, getAllBooks);
router.get("/user", protectRoute, recommendedBooks);
router.delete("/:id", protectRoute, deleteBookPost);

export default router;