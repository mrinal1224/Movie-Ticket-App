const express = require("express");
const User = require("../models/user.model.js");
const bcrypt = require('bcryptjs')

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
    const salt = await bcrypt.genSalt(10)
    const hashPwd = bcrypt.hashSync(req.body.password , salt)
    req.body.password = hashPwd



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

module.exports = userRouter