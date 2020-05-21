var Book = require('../models/book');
var Author = require('../models/author');
var Genre = require('../models/genre');
var BookInstance = require('../models/bookinstance');

const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
var async = require('async');

exports.index = function(req, res) {
    async.parallel({
        book_count: function(callback) {
            Book.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
        },
        book_instance_count: function(callback) {
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count: function(callback) {
            BookInstance.countDocuments({status:'Available'}, callback);
        },
        author_count: function(callback) {
            Author.countDocuments({}, callback);
        },
        genre_count: function(callback) {
            Genre.countDocuments({}, callback);
        }
    }, function(err, results) {
        res.render('index', { title: 'Local Library Home', error: err, data: results });
    });
};

// Display list of all books.
exports.book_list = function(req, res, next) {
    Book.find({}, 'title author')
        .populate('author')
        .exec(function (err, list_books) {
            if(err) {return next(err); }
            // Successful, so render
            console.log(list_books[0].author.name)
            res.render('book_list', { title: 'Book List', book_list: list_books});
        })

};

// Display detail page for a specific book.
exports.book_detail = function(req, res) {
    async.parallel({
        book: function(callback) {

            Book.findById(req.params.id)
                .populate('author')
                .populate('genre')
                .exec(callback);
        },
        book_instance: function(callback) {

            BookInstance.find({ 'book': req.params.id })
                .exec(callback);
        },
    }, function(err, results) {
        if(err) { return next(err); }
        if(results.book==null) {
            // No results.
            var err = new Error('Book not found')
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('book_detail', { title: results.book.title, book: results.book, book_instances: results.book_instance})
    }
    )
};

// Display book create form on GET.
exports.book_create_get = function(req, res, next) {
    async.parallel({
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
    }, function(err, results) {
        if(err) { return  next(err); }
        res.render('book_form', { title: 'Create Book', authors: results.authors, genres: results.genres})
    })
};

// Handle book create on POST.
exports.book_create_post = [
    // Convert the genre to an array
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre==='undefined')
            req.body.genre=[];
            else
            req.body.genre=new Array(req.body.genre);
        }
        next();
    },

    // Validate fields.
    body('title', 'Title must not be empty').trim().isLength({ min: 1 }),
    body('author', 'Author must not be empty').trim().isLength({ min: 1 }),
    body('summary', 'Summary must not be empty').trim().isLength({ min: 1 }),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }),

    // Sanitize fields
    sanitizeBody('*').escape(),

    // Process request after validation and sanitization
    (req, res, next) => {

        // Extract the validation errors
        const errors = validationResult(req);

        // Create a Book object
        var book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre
        });

        if(!errors.isEmpty()) {
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                },
            }, function(err, results) {
                if(err) { return next(err); }

                // Mark our selected genres as checked
                for (let i = 0; i < results.genres.length; i ++) {
                    if(book.genre.indexOf(results.genres[i]._id) >  -1) {
                        results.genres[i].checked='true';
                    }
                }
                res.render('book_form', { title: 'Create Book', authors: results.authors, genres: results.genres, book: book, errors: errors.array() });
            })
            return;
        }
        else {
            // Data from form is valid. Save book.
            book.save(function (err) {
                if(err) { return next(err); }
                // Successful - redirect to new book recors
                res.redirect(book.url);
            });
        }
    }
];

// Display book delete form on GET.
exports.book_delete_get = function(req, res) {
    
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id)
                .exec(callback);
        },
        book_bookinstances: function(callback) {
            BookInstance.find({ 'book': req.params.id })
                .exec(callback);
        }
    }, function(err, results) {
        if(err) { return next(err); }
        if(results.book==null) {
            // No results.
            var err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        res.render('book_delete', { title: 'Delete book', book: results.book, book_bookinstances: results.book_bookinstances})
    });

};

// Handle book delete on POST.
exports.book_delete_post = function(req, res) {

    async.parallel({
        book: function(callback) {
            Book.findById(req.body.bookid)
                .exec(callback);
        },
        book_bookinstances: function(callback) {
            BookInstance.find({ 'book': req.body.bookid })
                .exec(callback);
        }
    }, function(err, results) {
        if(err) { return next(err); }
        if(results.book==null) {
            var err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        if(results.book_bookinstances.length > 0) {
            // Not all bookinstances are deleted -> rerender
            res.render('book_delete', { title: 'Delete book', book: results.book, book_bookinstances: results.book_bookinstances})
            return;
        }
        else {
            Book.findByIdAndDelete(req.body.bookid, function deleteBook(err) { 
                if(err) { return next(err); }
                // Successful - go to book list
                res.redirect('../../books')
            })
        }
    });

};

// Display book update form on GET.
exports.book_update_get = function(req, res, next) {
    
    // Get book, authors and genres for form
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id)
                .populate('author')
                .populate('genre')    
                .exec(callback);
        },
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
    }, function(err, results) {
        if(err) { return next(err); }
        if(results.book==null) {
            // No results.
            var err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        // Success.
        // Mark our selected genres as checked
        for(var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter ++){
            for(var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter ++) {
                if(results.book.genre[book_g_iter]._id.toString() === results.genres[all_g_iter]._id.toString()) {
                    results.genres[all_g_iter].checked='true';
                }
            }
        }
        res.render('book_form', { title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book });
    });

};

// Handle book update on POST.
exports.book_update_post = [

    // Covnert the genre to an array
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)) {
            if(typeof req.body.genre==='undefined')
            req.body.genre=[];
            else
            req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    // Validate fields
    body('title', 'Title must be specified').trim().isLength({ min: 1 }),
    body('isbn', 'ISBN must be specified').trim().isLength({ min: 1 }),
    body('author', 'Author must be specified').trim().isLength({ min: 1 }),
    body('summary', 'Summary must be specified').trim().isLength({ min: 1 }),

    // Sanitize fields
    sanitizeBody('title').escape(),
    sanitizeBody('isbn').escape(),
    sanitizeBody('author').escape(),
    sanitizeBody('summary').escape(),
    sanitizeBody('genre.*').escape(),

    // Process validated and sanitized request
    (req, res, next) => {

        const errors = validationResult(req);

        var book = new Book({
            title: req.body.title,
            isbn: req.body.isbn,
            summary: req.body.summary,
            author: req.body.author,
            genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre,
            _id: req.params.id
        });

        if(!errors.isEmpty()) {
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                },
            }, function(err, results) {
                if(err) { return next(err); }
                for(var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter ++){
                    for(var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter ++) {
                        if(results.book.genre[book_g_iter]._id.toString() === results.genres[all_g_iter]._id.toString()) {
                            results.genres[all_g_iter].checked='true';
                        }
                    }
                }
                res.render('book_form', { title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book, errors: errors.array() });
            });
            return;
        }
        else {
            Book.findByIdAndUpdate(req.params.id, book, {}, function (err, thebook) {
                if(err) { return next(err); }
                // Successful - redirect to book detail page
                res.redirect(thebook.url)
            });
        }
    }
];