const express = require("express")
const protect = require("../middlewares/authMiddleware")
const  { createProduct, getAllProducts, getSingleProduct, deleteProduct, updateProduct }  =  require("../controllers/product");
const  { upload }  = require("../utils/fileUpload");



const router = express.Router();

// Create product
router.post("/", protect, upload.single('image'), createProduct) //to upload single file

// Get all products
router.get("/", protect, getAllProducts) 

// Get single product
router.get("/:id", protect, getSingleProduct) 

// Delete product
router.delete("/:id", protect, deleteProduct) 

// update product
router.patch("/:id", protect, upload.single('image'), updateProduct) 

module.exports =  router