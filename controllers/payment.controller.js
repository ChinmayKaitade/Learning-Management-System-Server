import User from "../models/user.model.js";
import { razorpay } from "../server.js";

export const getRazorpayApiKey = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Razorpay API Key.",
    key: process.env.RAZORPAY_KEY_ID,
  });
};

export const buySubscription = async (req, res, next) => {
  // Extracting ID from request obj
  const { id } = req.user;

  // Finding the user based on the ID
  const user = await User.findById(id);

  // If user does not exists
  if (!user) {
    return next(new AppError("Unauthorized, Please login."));
  }

  // Checking the user role
  if (user.role === "ADMIN") {
    return next(new AppError("Admin cannot Purchase a Subscription.", 400));
  }

  // Creating a subscription using razorpay that we imported from the server
  const subscription = await razorpay.subscriptions.create({
    plan_id: process.env.RAZORPAY_PLAN_ID, // The unique plan ID
    customer_notify: 1, // 1 means razorpay will handle notifying the customer, 0 means we will not notify the customer
    total_count: 12, // 12 means it will charge every month for a 1-year sub.
  });

  // Adding the ID and the status to the user account
  user.subscription.id = subscription.id;
  user.subscription.status = subscription.status;

  // Saving the user object
  await user.save();

  res.status(200).json({
    success: true,
    message: "Subscribed Successfully.",
    subscription_id: subscription.id,
  });
};

export const cancelSubscription = async (req, res, next) => {
  //
};

export const verifySubscription = async (req, res, next) => {
  //
};

export const allPayments = async (req, res, next) => {
  //
};
