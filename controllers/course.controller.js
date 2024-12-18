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
  try {
    // fetching course id from req params
    const { id } = req.params;
    console.log("Course Id:", id);

    // finding course
    const course = await Course.findById(id);
    console.log("Course Details:", course);

    // if course does not exists or course id doesn't exists
    if (!course) {
      return next(new AppError("Course Not Found, Invalid Course Id.", 400));
    }

    res.status(200).json({
      success: true,
      message: "Course Lectures Fetched Successfully.",
      lectures: course.lectures,
    });
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
};

export { getAllCourses, getLecturesByCourseId };
