const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
    sessionId: { type: String, required: true }, 
    domain: { type: String, required: true }, 
    items: [{
        productId: { type: String, required: true },
        title: { type: String, required: true },
        image: { type: String, required: true },
        qty: { type: Number, required: true },  
        price_regular: { type: Number, required: true }, 
        price_sale: { type: Number, required: true }, 
    }],
    total: { type: Number, required: true },
    currency: { type: String, required: true },
    cantItems: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now } 
});

CartSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Cart', CartSchema);
