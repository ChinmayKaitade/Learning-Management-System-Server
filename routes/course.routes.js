import { Router } from "express";
import {
  getAllCourses,
  getLecturesByCourseId,
} from "../controllers/course.controller.js";

const router = Router();

// router.get("/", getAllCourses);
// router.get("/:id", getLecturesByCourseId);

router.route("/").get(getAllCourses);
router.route("/:id").get(getLecturesByCourseId);


export default router;
