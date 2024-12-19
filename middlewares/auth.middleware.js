import jwt from "jsonwebtoken";

const isLoggedIn = async (req, res, next) => {
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
};

const authorizedRoles =
  (...roles) =>
  async (req, res, next) => {
    const currentUserRoles = req.user.role;

    if (!roles.includes(currentUserRoles)) {
      return next(
        new Error("You do not permission to excess this route.", 403)
      );
    }

    next();
  };

export { isLoggedIn, authorizedRoles };
