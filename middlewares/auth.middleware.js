import jwt from "jsonwebtoken";
import AppError from "../utils/appError.js";
import asyncHandler from "./asyncHandler.middleware.js";
import User from "../models/user.model.js";

const isLoggedIn = asyncHandler(async (req, res, next) => {
  // extracting token from the cookies
  const { token } = req.cookies;

  // If no token send unauthorized message
  if (!token) {
    return next(new Error("Unauthenticated, Please Login again", 401));
  }

  // Decoding the token using jwt package verify method
  const userDetails = await jwt.verify(token, process.env.JWT_SECRET);

  // If all good store the id in req object, here we are modifying the request object and adding a custom field user in it
  req.user = userDetails;

  // Do not forget to call the next other wise the flow of execution will not be passed further
  next();
});

// Middleware to check if user is admin or not
const authorizedRoles =
  (...roles) =>
  async (req, res, next) => {
    const currentUserRole = req.user.role;

    if (!roles.includes(currentUserRole)) {
      return next(
        new AppError("You do not permission to excess this route.", 403)
      );
    }

    next();
  };

// Middleware to check if user has an active subscription or not
const authorizeSubscribers = async (req, res, next) => {
  // const subscription = req.user.subscription;
  // const currentUserRole = req.user.role;

  // If user is not admin or does not have an active subscription then error else pass
  const user = await User.findById(req.user.id);
  console.log(user);
  if (user.role !== "ADMIN" && user.subscription.status !== "active") {
    return next(new AppError("Please Subscribe to access this route.", 403));
  }

  next();
};

export { isLoggedIn, authorizedRoles, authorizeSubscribers };
