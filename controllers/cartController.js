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
                slug:item.slug,
                isValid: true
            };
        }));

        const calculatedTotal = validItems.reduce((acc, item) => acc + (item.valid_price * item.qty), 0);

        if (calculatedTotal !== Total) {
            console.log(`Total calculado: ${calculatedTotal}, Total recibido: ${Total}. Ajustando el total.`);
        }

        const calculatedCantItems = validItems.reduce((acc, item) => acc + item.qty, 0);

        const sessionId = sessionIdh || jwt.sign({ sessionId: new mongoose.Types.ObjectId().toString() }, process.env.SESSION_SECRET, { expiresIn: '2h' });

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

        res.status(200).json({
            status: true,
            sessionId,
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

exports.deleteCart = async (req, res) => {
    try {
        const domain = req.headers['domain'];
        const sessionIdh = req.headers['sessionid'];

        if (!domain || !sessionIdh) {
            return res.status(400).json({ message: 'Dominio o sesión no proporcionados' });
        }

        const cart = await Cart.findOneAndDelete({ sessionId: sessionIdh, domain: domain });

        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado para esta sesión y dominio' });
        }

        res.status(200).json({ status: true, message: 'Carrito eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el carrito', error: error.message });
    }
};
