const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cartRoutes = require('./routes/cartRoutes');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;
const mongodb = process.env.MONGO_URL || 5000;

app.use(cors());
app.use(bodyParser.json()); 
app.use('/api/cart', cartRoutes);

mongoose.connect(mongodb, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Conectado a MongoDB'))
    .catch((err) => console.log('Error de conexión a MongoDB:', err));

app.listen(port, () => {
    console.log(`Servidor en ejecución en el puerto ${port}`);
});
