const express = require("express");
const User = require("../models/user.model.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userRouter = express.Router(); // Route

// Sign up Route

userRouter.post("/register", async (req, res) => {
  try {
    // check if the user already exits
    const userExists = await User.findOne({ email: req.body.email });
    if (userExists) {
      res.send({
        success: false,
        message: "User Already Exists with the Email",
      });
    }

    // hash the password
    const salt = await bcrypt.genSalt(10);
    console.log(salt);
    const hashPwd = bcrypt.hashSync(req.body.password, salt);
    req.body.password = hashPwd;

    const newUser = await User(req.body);
    await newUser.save();

    res.send({
      success: true,
      message: "User Registered Successfully",
      user: newUser,
    });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

// Login Api

userRouter.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      res.send({
        success: false,
        message: "user does not exist Please Register",
      });
    }

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!validPassword) {
      res.send({
        success: false,
        message: "Sorry, invalid password entered!",
      });
    }

   const token =  jwt.sign({ userId: user._id }, process.env.JWT_SECRET , {expiresIn:'10d'});

    res.send({
      success: true,
      message: "You've successfully logged in!",
      token : token
    });
  } catch (error) {
    res.status(500).json({ message: "Error in Logging in!" });
  }
});

module.exports = userRouter;
