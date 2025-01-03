import { Router } from "express";
import {
  allPayments,
  buySubscription,
  cancelSubscription,
  getRazorpayApiKey,
  verifySubscription,
} from "../controllers/payment.controller.js";
import {
  authorizedRoles,
  authorizeSubscribers,
  isLoggedIn,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/subscribe").post(isLoggedIn, buySubscription);

router.route("/verify").post(isLoggedIn, verifySubscription);

router
  .route("/unsubscribe")
  .post(isLoggedIn, authorizeSubscribers, cancelSubscription);

router.route("/razorpay-key").get(isLoggedIn, getRazorpayApiKey);

router.route("/").get(isLoggedIn, authorizedRoles("ADMIN"), allPayments);

export default router;
