import AppError from "../utils/appError";

const register = async (req, res, next) => {
  // Destructuring the necessary data from req object
  const { fullName, email, password } = req.body;

  // Check if the data is there or not, if not throw error message
  if (!fullName || !email || !password) {
    return next(new AppError("All fields are Required", 400));
  }

  // Check if the user exists with the provided email
  const userExists = await User.findOne({ email });

  // If user exists send the response
  if (userExists) {
    return next(new AppError("Email already exists", 400));
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
      new AppError("User Registration Failed, Please try again later"),
      400
    );
  }

  // TODO: File Upload

  // Save the user object
  await user.save();
};

const login = (req, res) => {
  //
};

const logout = (req, res) => {
  //
};

const getProfile = (req, res) => {
  //
};

export { register, login, logout, getProfile };
