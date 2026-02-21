import User from "../models/User.js";
import bcrypt, { compare } from "bcryptjs";
import jwt from "jsonwebtoken";

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "15d" });
};

export const registerUser = async (req, res) => {
    try {
    const { email, username, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: "Password should be at least 6 characters long" });
    }

    if (username.length < 3) {
        return res.status(400).json({ message: "Username should be at least 3 characters long" });
    }

    // check if user already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
    }

    // get random avatar using a simpler/more reliable format
    const profileImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;

    const user = new User({
        email,
        username,
        password,
        profileImage,
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
        token,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage,
            createdAt: user.createdAt,
        },
    });
    } catch (error) {
        console.log("Error in register route", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const isMatch = await compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const token = generateToken(user._id);
        return res.status(200).json({ message: "Login successful", token, user: { _id: user.id, username: user.username, email: user.email, profileImage: user.profileImage } });
    } catch (error) {
        console.error("Error logging in user:", error);
        return res.status(500).json({ message: "Server error" });
    }
};