const Book  = require('../models/Book');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

exports.getAllBooks = (req, res, next) => {
    Book.find()
        .then(books => res.status(200).json(books))
        .catch(error => res.status(400).json({error}));
};

exports.getOneBook = (req, res, next) => {
    Book.findOne({_id: req.params.id})
        .then(book => res.status(200).json(book))
        .catch(error => res.status(404).json({error}));
};

exports.createBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;
    const rating = bookObject.rating;
    let book;

    if (!req.file) {
        return res.status(400).json({ message: "Aucune image envoyée" });
    }
    const inputPath = req.file.path;
    const outputFilename = `${req.file.filename.split('.')[0]}.webp`;
    const outputPath = path.join('images', outputFilename);

    sharp(inputPath)
        .resize({ width: 500 })
        .toFormat('webp')
        .webp({ quality: 80 })
        .toFile(outputPath)
        .then(() => {
            fs.unlinkSync(inputPath);
            if (rating){
                if (rating < 0 || rating > 5) {
                    return res.status(400).json({ message: 'La note doit être comprise entre 0 et 5'});
                }
                book = new Book({
                    ...bookObject,
                    userId: req.auth.userId,
                    imageUrl: `${req.protocol}://${req.get('host')}/images/${outputFilename}`,
                    ratings: [{ userId: req.auth.userId, grade: rating }],
                    averageRating: rating
                });
            }
            else {
                book = new Book({
                    ...bookObject,
                    userId: req.auth.userId,
                    imageUrl: `${req.protocol}://${req.get('host')}/images/${outputFilename}`,
                    ratings: [],
                    averageRating: 0
                });
            }
            book.save()
                .then(() => res.status(201).json({message: 'Livre enregistré'}))
                .catch(error => res.status(400).json({error}));
        })
        .catch(error => res.status(500).json({ error }));
};

exports.modifyBook = (req, res, next) => {
    const inputPath = req.file.path;
    const outputFilename = `${req.file.filename.split('.')[0]}.webp`;
    const outputPath = path.join('images', outputFilename);

    sharp(inputPath)
        .resize({ width: 500 })
        .toFormat('webp')
        .webp({ quality: 80 })
        .toFile(outputPath)
        .then(() => {
            fs.unlinkSync(inputPath);
            const bookObject = req.file ? {
                ...JSON.parse(req.body.book),
                imageUrl: `${req.protocol}://${req.get('host')}/images/${outputFilename}`
            } : {...req.body};
            delete bookObject._userId;
            Book.findOne({_id: req.params.id})
            .then((book) => {
                if (book.userId != req.auth.userId) {
                    res.status(403).json({message: 'Non-autorisé'});
                }
                else {
                    Book.updateOne({_id: req.params.id}, {...bookObject, _id: req.params.id})
                    .then(() => res.status(200).json({message: 'Livre modifié'}))
                    .catch(error => {res.status(401).json(error)});
                }
            })
            .catch(error => {res.status(400).json({error})});
        })
        .catch(error => res.status(500).json({ error }));
};

exports.deleteBook = (req, res, next) => {
    Book.findOne({_id: req.params.id})
    .then(book => {
        if(book.userId != req.auth.userId) {
            res.status(403).json({message: 'Non-autorisé'});
        }
        else {
            const filename = book.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Book.deleteOne({_id: req.params.id})
                .then(() => {res.status(200).json({message: 'Livre supprimé'})})
                .catch(error => res.status(401).json({error}));
            })
        }
    })
    .catch(error => {res.status(500).json({error})});
};

exports.createRating = (req, res, next) => {
    const bookObject = req.body;
    delete bookObject._id;
    delete bookObject._userId;
    const rating = bookObject.rating;
    const userId = req.auth.userId;
    const bookId = req.params.id;
    if (rating < 0 || rating > 5) {
        return res.status(400).json({message: 'La note doit être comprise entre 0 et 5'});
    }

    Book.findById(bookId)
    .then(book => {
        if(!book){
            return res.status(404).json({message: 'Livre non trouvé'});
        }
        const alreadyRated = book.ratings.find(ratin => ratin.userId === userId);
        if (alreadyRated) {
            return res.status(400).json({message: 'Vous avez déjà noté ce livre'});
        }
        book.ratings.push({userId: userId, grade: rating});
        const totalRatings = book.ratings.length;
        let sumRatings = 0;
        for (let ratin of book.ratings) {
            sumRatings += ratin.grade;
        }
        book.averageRating = sumRatings / totalRatings;
        book.save()
            .then(() => res.status(201).json(book))
            .catch(error => res.status(400).json({error}));
    })
    .catch(error => res.status(500).json({ error }));
};

exports.getBestBooks = (req, res, next) => {
    Book.find().sort({averageRating: -1}).limit(3)
        .then(books => {
            res.status(200).json(books)
        })
        .catch(error => {
            res.status(400).json({error})
        });
};