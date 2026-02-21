import cloudinary from "../lib/cloudinary.js";
import Book from "../models/Books.js";

export const createBookPost = async (req, res) => {
    try {
        const { title, author, price, publishedDate, caption, rating } = req.body;
        
        if(!title || !author || !price || !publishedDate || !caption || !rating || !req.file) return res.status(400).json({
            message: "Please provide all fields"
        });

        // Convert buffer to data URI and upload to Cloudinary
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        const uploadResponse = await cloudinary.uploader.upload(dataURI);
        const imageUrl = uploadResponse.secure_url;
        // save to the database

        const newBook = new Book({
            title,
            author,
            price,
            publishedDate,
            caption,
            rating,
            image: imageUrl,
            user: req.user._id
        })

        await newBook.save();

        res.status(201).json({
            message: "Book created successfully",
            book: newBook
        });
    } catch (error) {
        console.log("Error creating book:", error);
        res.status(500).json({
            message: error.message
        });
    }
};

export const getAllBooks = async (req, res) => {
    try {
        // pagination => infinite loading
        const page = req.query.page || 1;
        const limit = req.query.limit || 5;
        const skip = (page - 1) * limit;
        const books = await Book.find()
            .sort({ createdAt: -1 }) // descending order
            .skip(skip)
            .limit(limit)
            .populate("user", "username profileImage");

            const total = await Book.countDocuments();

        res.send({
            books,
            currentPage: page,
            totalBooks: total,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.log("Error in get all books route", error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const deleteBookPost = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if(!book) return res.status(404).json({ message: "Book not found" });

        // check if the user is the owner of the book
        if(book.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You are not authorized to delete this book" });
        }

        // delete the image from cloudinary
        if(book.image && book.image.includes("cloudinary")) {
            try {
                const publicId = book.image.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(publicId);
            } catch (error) {
                console.log("Error deleting image from Cloudinary:", error);
            }
        }
        
        await book.deleteOne();

        res.status(200).json({ message: "Book deleted successfully" });
    } catch (error) {
        console.log("Error deleting book:", error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const recommendedBooks = async (req, res) => {
    try {
        const books = (await Book.find({ user: req.user._id })).sort({ createdAt: -1 });
        res.status(200).json({ books });
    } catch (error) {
        console.error("Error fetching recommended books:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};