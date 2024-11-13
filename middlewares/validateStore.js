
module.exports = async (req, res, next) => {
    const domain = req.headers['domain']; 

    if (!domain) {
        return res.status(400).json({ message: 'El encabezado "domain" es requerido para identificar la tienda' });
    }

};
