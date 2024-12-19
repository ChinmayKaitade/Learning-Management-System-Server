export const getRazorpayApiKey = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Razorpay API Key.",
    key: process.env.RAZORPAY_KEY_ID,
  });
};

export const buySubscription = async (req, res, next) => {
  //
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
