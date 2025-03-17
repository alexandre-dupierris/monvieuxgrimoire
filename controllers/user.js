const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.signup = (req, res, next) => {
    // are the input ok ?
    if (!req.body.email || !req.body.password) {
        return res.status(400).json({ message: 'Email et mot de passe sont requis' });
    }
    // email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(req.body.email)) {
        return res.status(400).json({ message: 'Format d\'email invalide' });
    }
    // password format
    if (req.body.password.length < 8) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
    }
    bcrypt.hash(req.body.password, 10)
        .then(hash => {
            const user = new User({
                email: req.body.email,
                password: hash
            });
            user.save()
                .then(() => res.status(201).json({message: 'Utilisateur créé !'}))
                .catch(error => res.status(400).json({error}));
        })
        .catch(error => res.status(500).json({error}));
}

exports.login = (req, res, next) => {
    User.findOne({email: req.body.email})
    .then(user => {
        if (user === null) {
            res.status(401).json({message: 'Paire identifiant/mot de passe incorrecte'});
        }
        else {
            bcrypt.compare(req.body.password, user.password)
            .then(valid => {
                if (!valid) {
                    res.status(401).json({message: 'Paire identifiant/mot de passe incorrecte'});
                }
                else {
                    res.status(200).json({
                        userId: user._id,
                        token: jwt.sign(
                            { userId: user._id },
                            process.env.TOKEN,
                            {expiresIn: '24h'}
                        )
                    });
                }
            })
            .catch(error => res.status(500).json({error}));
        }
    })
    .catch(error => res.status(500).json({error}));
}