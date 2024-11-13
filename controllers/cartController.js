const Cart = require('../models/Cart');
const Products = require('../models/Product');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config();

exports.syncCart = async (req, res) => {
    try {
        const { items_cart, Total, currency } = req.body; 
        const domain = req.headers['domain']; 
        const sessionIdh = req.headers['sessionid']; 

        // Validar los productos del carrito
        const validItems = await Promise.all(items_cart.map(async item => {
            const product = await Products.findOne({ _id: item.id, domain: domain });

            if (!product) {
                return { ...item, isValid: false, error: 'Producto no encontrado en esta tienda' };
            }

            const finalPrice = (product.price.sale > 0 && product.price.sale < product.price.regular) 
                ? product.price.sale 
                : product.price.regular;

            return {
                productId: item.id,
                id: item.id,
                title: item.title,
                image: item.image,
                qty: item.qty,
                price_regular: product.price.regular,
                price_sale: product.price.sale,
                valid_price: finalPrice,
                isValid: true
            };
        }));

        const calculatedTotal = validItems.reduce((acc, item) => acc + (item.valid_price * item.qty), 0);

        if (calculatedTotal !== Total) {
            console.log(`Total calculado: ${calculatedTotal}, Total recibido: ${Total}. Ajustando el total.`);
        }

        const calculatedCantItems = validItems.reduce((acc, item) => acc + item.qty, 0);

        // Generar o recuperar el sessionId
        const sessionId = sessionIdh || jwt.sign({ sessionId: new mongoose.Types.ObjectId().toString() }, process.env.SESSION_SECRET, { expiresIn: '2h' });
        
        // Buscar o crear el carrito
        let cart = await Cart.findOne({ sessionId, domain: domain });
        if (!cart) {
            cart = new Cart({
                sessionId,
                domain: domain,
                items: validItems,
                total: calculatedTotal,
                currency,
                cantItems: calculatedCantItems, 
            });
        } else {
            cart.items = validItems;
            cart.total = calculatedTotal;
            cart.currency = currency;
            cart.cantItems = calculatedCantItems;
        }

        await cart.save();

        // Responder con la estructura solicitada
        res.status(200).json({
            status: true,
            cart: {
                items_cart: validItems,
                Total: calculatedTotal,
                currency: currency,
                cantItems: calculatedCantItems
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al sincronizar el carrito', error: error.message });
    }
};
