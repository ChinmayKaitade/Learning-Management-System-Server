import Course from "../models/course.model.js";
import AppError from "../utils/appError.js";

const getAllCourses = async (req, res, next) => {
  try {
    // Find all the courses without lectures
    const courses = await Course.find({}).select("-lectures");

    res.status(200).json({
      success: true,
      message: "All Courses",
      courses,
    });
  } catch (error) {
    return next(new AppError("Error in fetching all Courses.", 400));
  }
};

const getLecturesByCourseId = async (req, res, next) => {
  //
};

export { getAllCourses, getLecturesByCourseId };
