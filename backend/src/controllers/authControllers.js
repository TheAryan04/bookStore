import User from "../models/User.js";
import bcrypt, { compare } from "bcryptjs";
import jwt from "jsonwebtoken";

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "15d" });
};

export const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if(password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        if(username.length < 3) {
            return res.status(400).json({ message: "Username must be at least 3 characters long" });
        }

        // check if user already exists

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: "Email already in use" });
        }
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: "Username already taken" });
        }

        // get random avatar

        const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);
        const compare = (password, hash) => {
            return bcrypt.compareSync(password, hash);
        };
        const isMatch = compare(password, hash);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        const newUser = new User({ username, email, password: hash, profileImage });
        await newUser.save();
        
        const token = generateToken(newUser._id);
        return res.status(201).json({ message: "User registered successfully", token, user: { _id: newUser.id, username:newUser.username, email:newUser.email, profileImage:newUser.profileImage } });
    } catch (error) {
        console.error("Error registering user:", error);
        return res.status(500).json({ message: "Server error" });
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