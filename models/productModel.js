const mongoose = require("mongoose")

const schema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "user"
    },
    name: {
        type: String,
        required: [true, "Please add a name"],
        trim: true,
    },
    sku: {
        type: String,
        required: true,
        default: "SKU",
        trim: true,
    },
    category: {
        type: String,
        required: [true, "Please add a category"],
        trim: true,
    },
    quantity: {
        type: Number,
        required: [true, "Please add quantity"],
        trim: true,
    },
    price: {
        type: Number,
        required:[true, "Please add a price"],
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Please add description"],
        trim: true,
    },
    image: {
        type: Object,
        default: {}
    },
}, {
    Timestamps: true,
})

const Product = mongoose.model("Product" , schema);
module.exports = Product