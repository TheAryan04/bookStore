import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protectRoute = async (req, res, next) => {
    try {
        // get token
        const authHeader = req.header("Authorization");
        if (!authHeader) return res.status(401).json({ message: "No authentication token, access denied" });
        
        const token = authHeader.replace("Bearer ", "");
        if (!token) return res.status(401).json({ message: "No authentication token, access denied" });

        // verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // find user
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) return res.status(401).json({ message: "User not found" });

        req.user = user;
        next();
    } catch (error) {
        console.error("Authentication error:", error.message);
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token format" });
        }
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token has expired" });
        }
        res.status(401).json({ message: "Token is not valid" });
    }
};

export default protectRoute;