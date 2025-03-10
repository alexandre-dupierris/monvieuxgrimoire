// import necessary modules
const express = require('express'); // web framework of node.JS to handle routes, http requets and middlewares 
const mongoose = require('mongoose'); // to interact with mongoDB
const app = express(); // create an express application
const bookRoutes = require('./routes/books'); // import routes for managing the books
const userRoutes = require('./routes/user'); // import routes for user authentification
const path = require('path'); // module for handling file paths

// connect to mongoDB
mongoose.connect('mongodb+srv://alexandredupierris:TqNk8GQANiDJIJTD@cluster0.p9gdl.mongodb.net/?retryWrites=true&w=majority')
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch(err => console.error('Connexion à MongoDB échouée !', err)
);

// middleware to configure CORS (Cross-Origin Resource Sharing)
// this allows the API to be accessed from any origin
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

// middleware to parse incoming json files, to correctly read thease
app.use(express.json());

// define routes
app.use('/api/books', bookRoutes);
app.use('/api/auth', userRoutes);

// middeware to serve static files (images)
app.use('/images', express.static(path.join(__dirname, 'images')));

// export the application to be used in server.js
module.exports = app;