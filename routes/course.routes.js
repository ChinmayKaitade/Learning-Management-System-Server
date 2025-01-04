import { Router } from "express";
import {
  addLecturesToCourseById,
  createCourse,
  getAllCourses,
  getLecturesByCourseId,
  removeCourse,
  removeLectureFromCourse,
  updateCourse,
} from "../controllers/course.controller.js";
import {
  authorizedRoles,
  authorizeSubscribers,
  isLoggedIn,
} from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

// router.get("/", getAllCourses);
// router.get("/:id", getLecturesByCourseId);

router
  .route("/")
  .get(getAllCourses)
  .post(
    isLoggedIn,
    authorizedRoles("ADMIN"),
    upload.single("thumbnail"),
    createCourse
  )
  .delete(isLoggedIn, authorizedRoles("ADMIN"), removeLectureFromCourse);

router
  .route("/:id")
  .get(isLoggedIn, authorizeSubscribers, getLecturesByCourseId) // Added authorizeSubscribers to check if user is admin or subscribed if not then forbid the access to the lectures
  .post(
    isLoggedIn,
    authorizedRoles("ADMIN"),
    upload.single("lecture"),
    addLecturesToCourseById
  )
  .put(isLoggedIn, authorizedRoles("ADMIN"), updateCourse);

export default router;
