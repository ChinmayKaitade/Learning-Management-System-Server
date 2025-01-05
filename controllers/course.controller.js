import asyncHandler from "../middlewares/asyncHandler.middleware.js";
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

const addLecturesToCourseById = asyncHandler(async (req, res, next) => {
  const { title, description } = req.body;
  const { id } = req.params;

  let lectureData = {};

  if (!title || !description) {
    return next(new AppError("Title and Description are required", 400));
  }

  const course = await Course.findById(id);

  if (!course) {
    return next(new AppError("Invalid course id or course not found.", 400));
  }

  // Run only if user sends a file
  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms", // Save files in a folder named lms
        chunk_size: 50000000, // 50 mb size
        resource_type: "video",
      });

      // If success
      if (result) {
        // Set the public_id and secure_url in array
        lectureData.public_id = result.public_id;
        lectureData.secure_url = result.secure_url;
      }

      // After successful upload remove the file from local storage
      fs.rm(`uploads/${req.file.filename}`);
    } catch (error) {
      // Empty the uploads directory without deleting the uploads directory
      for (const file of await fs.readdir("uploads/")) {
        await fs.unlink(path.join("uploads/", file));
      }

      // Send the error message
      return next(
        new AppError(
          JSON.stringify(error) || "File not uploaded, please try again",
          400
        )
      );
    }
  }

  course.lectures.push({
    title,
    description,
    lecture: lectureData,
  });

  // Update the number of lectures
  course.numbersOfLectures = course.lectures.length;

  // Save the course object
  await course.save();

  res.status(200).json({
    success: true,
    message: "Course Lecture added Successfully",
    course,
  });
});

const removeLectureFromCourse = asyncHandler(async (req, res, next) => {
  // Grabbing the courseId and lectureId from req.query
  const { courseId, lectureId } = req.query;

  console.log(courseId);

  // Checking if both courseId and lectureId are present
  if (!courseId) {
    return next(new AppError("Course ID is required", 400));
  }

  if (!lectureId) {
    return next(new AppError("Lecture ID is required", 400));
  }

  // Find the course using the courseId
  const course = await Course.findById(courseId);

  // If no course send custom message
  if (!course) {
    return next(new AppError("Invalid ID or Course does not exist.", 404));
  }

  // Find the index of the lecture using the lectureId
  const lectureIndex = course.lectures.findIndex(
    (lecture) => lecture._id.toString() === lectureId.toString()
  );

  // If returned index is -1 then send error as mentioned below
  if (lectureIndex === -1) {
    return next(new AppError("Lecture does not exist.", 404));
  }

  // Delete the lecture from cloudinary
  await cloudinary.v2.uploader.destroy(
    course.lectures[lectureIndex].lecture.public_id,
    {
      resource_type: "video",
    }
  );

  // Remove the lecture from the array
  course.lectures.splice(lectureIndex, 1);

  // update the number of lectures based on lectures array length
  course.numbersOfLectures = course.lectures.length;

  // Save the course object
  await course.save();

  // Return response
  res.status(200).json({
    success: true,
    message: "Course Lecture removed Successfully",
  });
});

const updateCourseById = async (req, res, next) => {
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

export const deleteCourseById = asyncHandler(async (req, res, next) => {
  // Extracting id from the request parameters
  const { id } = req.params;

  // Finding the course via the course ID
  const course = await Course.findById(id);

  // If course not find send the message as stated below
  if (!course) {
    return next(new AppError("Course with given id does not exist.", 404));
  }

  // Remove course
  await course.remove();

  // Send the message as response
  res.status(200).json({
    success: true,
    message: "Course Deleted successfully",
  });
});

export {
  getAllCourses,
  getLecturesByCourseId,
  createCourse,
  updateCourseById,
  addLecturesToCourseById,
  removeLectureFromCourse,
};
