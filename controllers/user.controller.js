import User from "../models/user.model.js";
import AppError from "../utils/appError.js";
import cloudinary from "cloudinary";
import fs from "fs/promises";
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";

const cookieOptions = {
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  httpOnly: true,
  secure: true,
};

const register = async (req, res, next) => {
  // Destructuring the necessary data from req object
  const { fullName, email, password } = req.body;

  // Check if the data is there or not, if not throw error message
  if (!fullName || !email || !password) {
    return next(new AppError("All fields are Required.", 400));
  }

  // Check if the user exists with the provided email
  const userExists = await User.findOne({ email });

  // If user exists send the response
  if (userExists) {
    return next(new AppError("Email already exists.", 400));
  }

  // Create new user with the given necessary data and save to DB
  const user = await User.create({
    fullName,
    email,
    password,
    avatar: {
      public_id: email,
      secure_url:
        "https://res.cloudinary.com/du9jzqlpt/image/upload/v1674647316/avatar_drzgxv.jpg",
    },
  });

  // If user not created send message response
  if (!user) {
    return next(
      new AppError("User Registration Failed, Please try again later."),
      400
    );
  }

  console.log("File Details :", JSON.stringify(req.file));
  // File Upload
  // Run only if user sends a file
  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms", // Save files in a folder named lms
        width: "250",
        height: "250",
        gravity: "faces", // This option tells cloudinary to center the image around detected faces (if any) after cropping or resizing the original image
        crop: "fill",
      });

      // If success
      if (result) {
        // Set the public_id and secure_url in DB
        user.avatar.public_id = result.public_id;
        user.avatar.secure_url = result.secure_url;

        // After successful upload remove the file from local storage
        fs.rm(`uploads/${req.file.filename}`);
      }
    } catch (error) {
      new AppError(error || "File not uploaded, please try again.", 500);
    }
  }

  // Save the user object
  await user.save();

  // Setting the password to undefined so it does not get sent in the response
  user.password = undefined;

  // Generating a JWT token
  const token = await user.generateJWTToken();

  // Setting the token in the cookie with name token along with cookieOptions
  res.cookie("token", token, cookieOptions);

  // If all good send the response to the frontend
  res.status(201).json({
    success: true,
    message: "User Registered Successfully.",
    user,
  });
};

const login = async (req, res, next) => {
  try {
    // Destructuring the necessary data from req object
    const { email, password } = req.body;

    // Check if the data is there or not, if not throw error message
    if (!email || !password) {
      return next(new AppError("All Fields are Required.", 400));
    }

    // Finding the user with the sent email
    const user = await User.findOne({ email }).select("+password");

    // If no user or sent password do not match then send generic response
    if (!user || !user.comparePassword(password)) {
      return next(new AppError("Email or Password does not match.", 400));
    }

    // Generating a JWT token
    const token = await user.generateJWTToken();

    // Setting the password to undefined so it does not get sent in the response
    user.password = undefined;

    // Setting the token in the cookie with name token along with cookieOptions
    res.cookie("token", token, cookieOptions);

    // If all good send the response to the frontend
    res.status(200).json({
      success: true,
      message: "User LoggedIn Successfully.",
      user,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

const logout = (req, res) => {
  // Setting the cookie value to null
  res.cookie("token", null, {
    secure: true,
    maxAge: 0,
    httpOnly: true,
  });

  // Sending the response
  res.status(200).json({
    success: true,
    message: "User Logged Out Successfully.",
  });
};

const getProfile = async (req, res) => {
  try {
    // Finding the user using the id from modified req object
    const userId = req.user.id;
    const user = await User.findById(userId);

    res.status(200).json({
      success: true,
      message: "User Details Fetched.",
      user,
    });
  } catch (error) {
    return new AppError("Failed to fetched User Details.", 500);
  }
};

const forgotPassword = async (req, res, next) => {
  // Extracting email from request body
  const { email } = req.body;

  // If no email send email required message
  if (!email) {
    return next(new AppError("Email is required.", 500));
  }

  // Finding the user via email
  const user = await User.findOne({ email });

  // If no email found send the message email not found
  if (!user) {
    return next(new AppError("Email not registered.", 400));
  }

  // Generating the reset token via the method we have in user model
  const resetToken = await user.generatePasswordResetToken();

  // Saving the forgotPassword to DB
  await user.save();

  const resetPasswordURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  console.log(resetPasswordURL);

  // We here need to send an email to the user with the token
  const subject = "Reset Password";
  const message = `You can reset your password by clicking <a href=${resetPasswordURL} target="_blank">Reset your password</a>\nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordURL}.\n If you have not requested this, kindly ignore.`;

  try {
    await sendEmail(email, subject, message);

    // If email sent successfully send the success response
    res.status(200).json({
      success: true,
      message: `Reset Password token has been sent to ${email} Successfully.`,
    });
  } catch (error) {
    // If some error happened we need to clear the forgotPassword* fields in our DB
    user.forgotPasswordExpiry = undefined;
    user.forgotPasswordToken = undefined;

    await user.save();

    return next(
      new AppError(
        error.message || "Something went Wrong, Please try again.",
        500
      )
    );
  }
};

const resetPassword = async (req, res, next) => {
  // Extracting resetToken from req.params object
  const { resetToken } = req.params;

  // Extracting password from req.body object
  const { password } = req.body;

  // We are again hashing the resetToken using sha256 since we have stored our resetToken in DB using the same algorithm
  const forgotPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Check if password is not there then send response saying password is required
  const user = await User.findOne({
    forgotPasswordToken,
    forgotPasswordExpiry: { $gt: Date.now() }, // $gt will help us check for greater than value, with this we can check if token is valid or expired
  });

  // If not found or expired send the response
  if (!user) {
    return next(
      new AppError("Token is invalid or expired, Please try again.", 400)
    );
  }

  // Update the password if token is valid and not expired
  user.password = password;

  // making forgotPassword values undefined in the DB
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;

  // Saving the updated user values
  user.save();

  // Sending the response when everything goes good
  res.status(200).json({
    success: true,
    message: "Your Password has been Changed Successfully.",
  });
};

const changePassword = async (req, res, next) => {
  // Destructuring the necessary data from the req object
  const { oldPassword, newPassword } = req.body;
  const { id } = req.user; // because of the middleware isLoggedIn

  // Check if the values are there or not
  if (!oldPassword || !newPassword) {
    return next(new AppError("All Fields are Mandatory.", 400));
  }

  // Finding the user by ID and selecting the password
  const user = await Users.findById(id).select("+password");

  // If no user then throw an error message
  if (!user) {
    return next(new AppError("User does not exists.", 400));
  }

  // Check if the old password is correct
  const isPasswordValid = await user.comparePassword(oldPassword);

  // If the old password is not valid then throw an error message
  if (!isPasswordValid) {
    return next(new AppError("Invalid Old Password.", 400));
  }

  // Setting the new password
  user.password = newPassword;

  // Save the data in DB
  await user.save();

  // Setting the password undefined so that it won't get sent in the response
  user.password = undefined;

  res.status(200).json({
    success: true,
    message: "Password Changed Successfully.",
  });
};

const updateUser = async (req, res, next) => {
  // Destructuring the necessary data from the req object
  const { fullName } = req.body;
  const { id } = req.user.id;

  const user = await User.findById(id);

  // If no user then throw an error message
  if (!user) {
    return next(new AppError("User does not exists."));
  }

  // If fullName exists then update fullName
  if (req.fullName) {
    user.fullName = fullName;
  }

  // Run only if user sends a file
  if (req.file) {
    // Deletes the old image uploaded by the user
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms", // Save files in a folder named lms
        width: 250,
        height: 250,
        gravity: "faces", // This option tells cloudinary to center the image around detected faces (if any) after cropping or resizing the original image
        crop: "fill",
      });

      // If success
      if (result) {
        // Set the public_id and secure_url in DB
        user.avatar.public_id = result.public_id;
        user.avatar.secure_url = result.secure_url;

        // After successful upload remove the file from local storage
        fs.rm(`uploads/${req.file.filename}`);
      }
    } catch (error) {
      return next(
        new AppError(error || "File not uploaded, Please try again.", 400)
      );
    }
  }

  // Save the user object
  await user.save();

  res.status(200).json({
    success: true,
    message: "User details updated Successfully.",
  });
};

export {
  register,
  login,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
  changePassword,
  updateUser,
};
