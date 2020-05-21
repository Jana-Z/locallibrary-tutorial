var async = require('async');
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
var Author = require('../models/author');
var Book = require('../models/book');

// Display list of all Authors
exports.author_list = function(req, res, next) {

    Author.find()
        .populate('author')
        .sort([['family_name', 'ascending']])
        .exec(function (err, list_authors) {
            if(err) { return next(err); }
            // Successful, so render
            res.render('author_list', { title: 'Author List', author_list: list_authors});
        });

};

// Display detail page for a specfic Author
exports.author_detail = function(req, res, next) {

    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id)
                .exec(callback)
        },
        author_books: function(callback) {
            Book.find({author: req.params.id}, 'title summary')
                .sort([['name', 'ascending']])
                .exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.author==null) {
            // No results.
            var err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('author_detail', { title: results.author.name, author: results.author, author_books: results.author_books } );
    })

};

// Display Author create from on GET
exports.author_create_get =  function(req, res) {
    res.render('author_form', { title: 'Create Author'});
};

// Handle Authore on POST
exports.author_create_post = [
    // Validate fields
    body('first_name').isLength({ min: 1 }).trim().withMessage('First name must be specified')
        .isAlphanumeric().withMessage('First name has non alphanumeric characters'),
    body('family_name').isLength({ min: 1 }).trim().withMessage('Family name must be specified')
        .isAlphanumeric().withMessage('Family name has non alphanumeric characters'),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601(),
    
    // Sanitize fields.
    sanitizeBody('first_name').escape(),
    sanitizeBody('family_name').escape(),
    sanitizeBody('date_of_birth').toDate(),
    sanitizeBody('date_of_death').toDate(),

    // Process request after validation and sanitaztion
    (req, res, next) => {
        console.log(req.body.date_of_birth);

        // Extract the validation errors from a request
        const errors = validationResult(req);

        
        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('author_form', { title: 'Create Author', author: req.body, errors:errors.array()});
            return;
        }
        else {
            // Data form is valid
            // Create a genre object with excaped and trimmed data
            var author = new Author(
                {
                    first_name: req.body.first_name,
                    family_name: req.body.family_name,
                    date_of_birth: req.body.date_of_birth,
                    date_of_death: req.body.date_of_death
                });
            author.save(function (err) {
                if(err) { return next(err); }
                // Succesful - redirect to new author record.
                res.redirect(author.url);
            })
        }
    }
];

// Display Author delete from on GET
exports.author_delete_get = function(req, res) {

    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id).exec(callback);
        },
        author_books: function(callback) {
            Book.find({ 'author': req.params.id }).exec(callback);
        }
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.author==null) {
            // No results.
            res.redirect('catalog/authors');
        }
        // Successful, so render
        res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.author_books });
    });

};

// Handle Author delete POST
exports.author_delete_post = function(req, res, next) {

    async.parallel({
        author: function(callback){
            Author.findById(req.body.authorid).exec(callback)
        },
        author_books: function(callback) {
            Book.find({ 'author': req.body.authorid }).exec(callback)
        }
    }, function(err, results) {
        if(err) { return next(err); }
        if(results.author_books.length > 0) {
            res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.author_books });
            return;
        }
        else {
            Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
                if(err) { return next(err); }
                // Successful - go to author list
                res.redirect('../../authors')
            })
        }
    });

};

// Display Author update from GET
exports.author_update_get = function(req, res, next) {
    
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id)
                .exec(callback);
        }
    }, function(err, results) {
        if(err) { return next(err); }
        if(results.author==null) {
            // No results.
            var err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        res.render('author_form', {title: 'Update Author', author: results.author})
    });

};

// Handle Author update on POST
exports.author_update_post = [

    // Validate fields
    body('first_name', 'First name must be specified').trim().isLength({ min: 1 }),
    body('family_name', 'Family name must be specified').trim().isLength({ min: 1 }),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
    body('date_of_death', 'Invalid date of death').optional({ checckFalsy: true }).isISO8601(),


    // Sanitize data
    sanitizeBody('first_name').escape(),
    sanitizeBody('family_name').escape(),
    sanitizeBody('date_of_birth').toDate(),
    sanitizeBody('date_of_death').toDate(),

    // Work with sanitized and validated data
    (req, res, next) => {

        const errors = validationResult(req);

        var author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
            _id: req.params.id
        });

        if(!errors.isEmpty()) {
            res.render('author_form', { title: 'Update Author', author: author, errors: errors.array()})
            return;
        }
        else {
            Author.findByIdAndUpdate(req.params.id, author, {}, function(err, thauthor) {
                if(err) { return next(err); }
                // Successful - redirect to author detail page
                res.redirect(author.url)
            })
        }
    }

];