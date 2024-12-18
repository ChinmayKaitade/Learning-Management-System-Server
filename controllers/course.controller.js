import Course from "../models/course.model.js";
import AppError from "../utils/appError.js";
import cloudinary from "cloudinary";
import fs from "fs/promises";

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

const createCourse = async (req, res, next) => {
  // fetching title, description, category and createdBy from request body
  const { title, description, category, createdBy } = req.body;

  // checking the condition
  if (!title || !description || !category || !createdBy) {
    return next(new AppError("All Fields are Required.", 400));
  }

  const course = await Course.create({
    title,
    description,
    category,
    createdBy,
    thumbnail: {
      public_id: "Dummy",
      secure_url: "Dummy",
    },
  });

  // course is created or not
  if (!course) {
    return next(
      new AppError("Course could not be created, Please try again.", 400)
    );
  }

  // Run only if user sends a file
  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
      });

      // If success
      if (result) {
        // Set the public_id and secure_url in array
        course.thumbnail.public_id = result.public_id;
        course.thumbnail.secure_url = result.secure_url;
      }

      // After successful upload remove the file from local storage
      fs.rm(`uploads/${req.file.filename}`);
    } catch (error) {
      return next(new AppError(error.message), 500);
    }
  }

  await course.save();

  res.status(200).json({
    success: true,
    message: "Course Created Successfully.",
    course,
  });
};

const updateCourse = async (req, res, next) => {
  try {
    // Extracting the course id from the request params
    const { id } = req.params;

    // Finding the course using the course id
    const course = await Course.findByIdAndUpdate(
      id,
      {
        $set: req.body,
      },
      {
        runValidators: true,
      }
    );

    // If no course found then send the response for the same
    if (!course) {
      return next(new AppError("Course does not exists.", 400));
    }

    // Sending the response after success
    res.status(200).json({
      success: true,
      message: "Course updated Successfully.",
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

const removeCourse = async (req, res, next) => {
  try {
    // Extracting id from the request parameters
    const { id } = req.params;

    // Finding the course via the course ID
    const course = await Course.findById(id);

    // If course not find send the message as stated below
    if (!course) {
      return next(new AppError("Course with given id does not exist.", 404));
    }

    // Remove course
    await Course.findByIdAndDelete(id);

    // Send the message as response
    res.status(200).json({
      success: true,
      message: "Course deleted Successfully.",
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

export {
  getAllCourses,
  getLecturesByCourseId,
  createCourse,
  updateCourse,
  removeCourse,
};
