const Book  = require('../models/Book');
const fs = require('fs');

// getting the books list
exports.getAllBooks = (req, res, next) => {
    Book.find()
        .then(books => res.status(200).json(books))
        .catch(error => res.status(400).json({error}));
};

// getting one book with the id from the dynamic url
exports.getOneBook = (req, res, next) => {
    Book.findOne({_id: req.params.id})
        .then(book => res.status(200).json(book))
        .catch(error => res.status(404).json({error}));
};

// creating a new book
exports.createBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;
    const rating = bookObject.rating;
    let book;

    // if there is no image
    if (!req.file) {
        return res.status(400).json({ message: "Aucune image envoyée" });
    }
    // if rating is defined
    if (rating) {
        if (rating < 0 || rating > 5) {
            return res.status(400).json({ message: 'La note doit être comprise entre 0 et 5'});
        }
        book = new Book({
            ...bookObject,
            userId: req.auth.userId,
            imageUrl: req.file.processedImageUrl,
            ratings: [{ userId: req.auth.userId, grade: rating }],
            averageRating: rating
        });
    // else if the rating is not defined
    } else {
        book = new Book({
            ...bookObject,
            userId: req.auth.userId,
            imageUrl: req.file.processedImageUrl,
            ratings: [],
            averageRating: 0
        });
    }
    // registering the new book
    book.save()
        .then(() => res.status(201).json({message: 'Livre enregistré'}))
        .catch(error => res.status(400).json({error}));
};

// modifying an existing book
exports.modifyBook = (req, res, next) => {
    // if there is an image, get json from the object book from the req.body, else, get the req.body
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: req.file.processedImageUrl
    } : {...req.body};
    
    delete bookObject._userId;
    // finding the book from the dynamic url
    Book.findOne({_id: req.params.id})
        .then((book) => {
            // if it's not the user that have created the book who wants to edit it
            if (book.userId != req.auth.userId) {
                return res.status(403).json({message: 'Non-autorisé'});
            }
            
            // if a new image is upload, delete the last one
            if (req.file) {
                const filename = book.imageUrl.split('/images/')[1];
                try {
                    fs.unlinkSync(`images/${filename}`);
                } catch (error) {
                    console.error('Erreur lors de la suppression de l\'ancienne image:', error);
                }
            }
            // updating the book
            Book.updateOne({_id: req.params.id}, {...bookObject, _id: req.params.id})
                .then(() => res.status(200).json({message: 'Livre modifié'}))
                .catch(error => res.status(401).json(error));
        })
        .catch(error => res.status(400).json({error}));
};

// deleting a book
exports.deleteBook = (req, res, next) => {
    // finding the book with the id from the url
    Book.findOne({_id: req.params.id})
    .then(book => {
        // if user is not authorised
        if(book.userId != req.auth.userId) {
            res.status(403).json({message: 'Non-autorisé'});
        }
        // else, deleting the image file from the folder, and the book from the bdd
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

// creating rating
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
    // finding the book from url id
    Book.findById(bookId)
    .then(book => {
        // if book doesn't exist
        if(!book){
            return res.status(404).json({message: 'Livre non trouvé'});
        }
        const alreadyRated = book.ratings.find(ratin => ratin.userId === userId);
        // if the book is already rated by this user
        if (alreadyRated) {
            return res.status(400).json({message: 'Vous avez déjà noté ce livre'});
        }
        // pushing the book rating to the ratings
        book.ratings.push({userId: userId, grade: rating});
        const totalRatings = book.ratings.length;
        // calculating the average rating
        let sumRatings = 0;
        for (let ratin of book.ratings) {
            sumRatings += ratin.grade;
        }
        book.averageRating = sumRatings / totalRatings;
        // saving the book to the bdd
        book.save()
            .then(() => res.status(201).json(book))
            .catch(error => res.status(400).json({error}));
    })
    .catch(error => res.status(500).json({ error }));
};

// getting best books
exports.getBestBooks = (req, res, next) => {
    // sorting by average ratings, the three best books
    Book.find().sort({averageRating: -1}).limit(3)
        .then(books => {
            res.status(200).json(books)
        })
        .catch(error => {
            res.status(400).json({error})
        });
};