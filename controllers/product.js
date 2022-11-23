const asyncHandler = require("express-async-handler")
const Product = require("../models/productModel.js")
const { fileSizeFormatter } = require("../utils/fileUpload.js")
const cloudinary = require("cloudinary").v2

// console.log(cloudinary.config().cloud_name);
// Create product
 const createProduct = asyncHandler(async(req, res) => {
    const { name, sku, category, quantity, price, description } = req.body;

    // Validations
    if(!name || !category || !quantity || !price || !description){
        res.status(400)
        throw new Error("Please fill in all fields");
    }

     // Handle image upload
     let fileData = {};
        if (req.file){

            // Save image to cloudinary
            let uploadedFile;
            try {
                // file name, folder name and then resource type that you want to send
                uploadedFile = await cloudinary.uploader.upload(req.file.path, { folder: "Pinventory", resource_type: "image" })
            } catch (error) {
                res.status(500)
                throw new Error("Image could not be uploaded")
            }

            fileData = {
                fileName: req.file.originalname,
                filePath: uploadedFile.secure_url,
                fileType: req.file.mimetype,
                fileSize: fileSizeFormatter(req.file.size, 2),
            }
    
        }  

    // Create product
    const product = await Product.create({
        user: req.user.id,
        name, sku, category, quantity, price, description,
        image: fileData,
    })

    res.status(201).json(product);
})

// Get all products
const getAllProducts = asyncHandler(async(req,res) => {

    // Get all products of the specific user and sort it in descending order 
    // reverse make the data to be sorted in descending order
    const products = await (await Product.find({ user: req.user.id }).sort("createdAt")).reverse();

    res.status(200).json(products);

})

// Get single product
const getSingleProduct = asyncHandler(async (req,res) => {
    
    const product = await Product.findById(req.params.id);
    if(!product){
        res.status(404)
        throw new Error("Product not found")
    }

    if(product.user.toString() !== req.user.id){
        res.status(401)
        throw new Error("User not authorized")
    }

    res.status(200).json(product);
});

// Delete a product
const deleteProduct = asyncHandler(async(req,res) => {
    const product = await Product.findById(req.params.id);
    // If product does not exist
    if(!product){
        res.status(404)
        throw new Error("Product not found")
    }

    // Match product to its user
    if(product.user.toString() !== req.user.id){
        res.status(401)
        throw new Error("User not authorized")
    }

    await product.remove();
    res.status(200).json({
        message: "Product deleted successfully",
    })

})

// Update product
const updateProduct = asyncHandler(async(req,res) => {
    const { name, category, quantity, price, description } = req.body;
    const { id } = req.params

    const product = Product.findById(id)

    if(!product){
        res.status(404)
        throw new Error("Product not found")
    }

     // Handle image upload
     let fileData = {};
        if (req.file){

            // Save image to cloudinary
            let uploadedFile;
            try {
                // file name, folder name and then resource type that you want to send
                uploadedFile = await cloudinary.uploader.upload(req.file.path, { folder: "Pinventory", resource_type: "image" })
            } catch (error) {
                res.status(500)
                throw new Error("Image could not be uploaded")
            }

            fileData = {
                fileName: req.file.originalname,
                filePath: uploadedFile.secure_url,
                fileType: req.file.mimetype,
                fileSize: fileSizeFormatter(req.file.size, 2),
            }
        }

           // Create product
        const updatedProduct = await Product.findByIdAndUpdate(
            { _id:id,}, 
            { 
                name, category, quantity, price, description,
                // Check if the fileData object is empty, then only populate
                // the image, else go with the default image present
                image: Object.keys(fileData).length === 0 ? product?.image : fileData,
            },
            {
                new: true,
                runValidators: true
            }
        )

   

    res.status(200).json(updatedProduct);
})

module.exports = {
    createProduct, getAllProducts,getSingleProduct,
    deleteProduct, updateProduct
}