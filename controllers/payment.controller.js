import User from "../models/user.model.js";
import { razorpay } from "../server.js";
import AppError from "../utils/appError.js";
import crypto from "crypto";

export const getRazorpayApiKey = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: "Razorpay API Key.",
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

export const buySubscription = async (req, res, next) => {
  try {
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
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

export const verifySubscription = async (req, res, next) => {
  try {
    // Extracting ID from request obj
    const { id } = req.user;

    // Extracting razorpay_payment_id, razorpay_subscription_id, razorpay_signature from request body
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = req.body;

    // Finding the user
    const user = await User.findById(id);

    if (!user) {
      return next(new AppError("Unauthorized, Please login.", 400));
    }

    // Getting the subscription ID from the user object
    const subscriptionId = user.subscription.id;

    // Generating a signature with SHA256 for verification purposes
    // Here the subscriptionId should be the one which we saved in the DB
    // razorpay_payment_id is from the frontend and there should be a '|' character between this and subscriptionId
    // At the end convert it to Hex value
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_payment_id}|${subscriptionId}`)
      .digest("hex");

    // Check if generated signature and signature received from the frontend is the same or not
    if (generatedSignature !== razorpay_signature) {
      return next(new AppError("Payment not verified, Please try again.", 400));
    }

    // If they match create payment and store it in the DB
    await Payment.create({
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    });

    // Update the user subscription status to active (This will be created before this)
    user.subscription.status = "active";

    // Save the user in the DB with any changes
    await user.save();

    res.status(200).json({
      success: true,
      message: "Payment verified Successfully.",
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

export const cancelSubscription = async (req, res, next) => {
  // Creating a subscription using razorpay that we imported from the server
  try {
    // Extracting ID from request obj
    const { id } = req.user;

    // Finding the user
    const user = await User.findById(id);

    // Checking the user role
    if (user.role === "ADMIN") {
      return next(
        new AppError("Admin does not need to cannot cancel Subscription.", 400)
      );
    }

    // Finding subscription ID from subscription
    const subscriptionId = user.subscription.id;

    const subscription = await razorpay.subscriptions.cancel(
      subscriptionId // subscription id
    );

    // Adding the subscription status to the user account
    user.subscription.status = subscription.status;

    // Saving the user object
    await user.save();
  } catch (error) {
    // Returning error if any, and this error is from razorpay so we have statusCode and message built in
    return next(new AppError(error.error.description, error.statusCode));
  }
};

export const allPayments = async (req, res, next) => {
  //
};
