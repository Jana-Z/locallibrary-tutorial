var Book = require('../models/book')
var BookInstance = require('../models/bookinstance');

const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
var async = require('async')

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res) {
    
    BookInstance.find()
        .populate('book')
        .exec(function (err, list_bookinstances) {
            if(err) {return next(err); }
            // Successful, so render
            res.render('bookinstance_list', {title: 'Book Instance List',  bookinstance_list: list_bookinstances})
        })
};

// Display list of all available BookInstances.
exports.bookinstance_list_available = function(req, res) {
    
    BookInstance.find({ status: 'Available' })
        .populate('book')
        .exec(function (err, list_bookinstances) {
            if(err) {return next(err); }
            // Successful, so render
            res.render('bookinstance_list_available', {title: 'Book Instance List Available',  bookinstance_list: list_bookinstances})
        })
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec(function(err, bookinstance) {
            if(err) { return next(err); }
            if(bookinstance==null) {
                // No results.
                var err = new Error('Author not found');
                err.status = 404;
                return next(err);
            }
            // Successful, so render
            res.render('bookinstance_detail', {title: bookinstance.id, bookinstance: bookinstance, book: bookinstance.book})
        })
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {
    
    Book.find({}, 'title')
        .exec(function (err, books) {
            if(err) { return next(err); }
            // Successful, so render
            res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books});
        })
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [

    // Validate fields
    body('book', 'Book must be specified').trim().isLength({ min: 1 }),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

    // Sanitize fields
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('due_back').toDate(),
    sanitizeBody('status').trim().escape(),

    (req, res, next) => {
        const errors = validationResult(req);

        var bookinstance = new BookInstance(
            { book: req.body.book,
              imprint: req.body.imprint,
              status: req.body.status,
              due_back: req.body.due_back
            });

        if (!errors.isEmpty()) {
            Book.find({}, 'title')
                .exec(function (err, books) {
                    if(err) { return next(err) };
                    res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books, errors: errors.array(), bookinstance: bookinstance, selected_book: bookinstance.book._id });
                });
            return;
        }
        else {
            // Data from form is valid
            bookinstance.save(function (err) {
                if(err) { return next(err) };
                res.redirect(bookinstance.url);
            });
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res) {

    BookInstance.findById(req.params.id)
        .populate('book')
        .exec(function(err, bookinstance) {
            if(err) { return next(err); }
            res.render('bookinstance_delete', { title: 'Delete Bookinstance', bookinstance: bookinstance})
        });

};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function (req, res, next) {

    BookInstance.findByIdAndRemove(req.body.bookinstanceid, function delteBookinstance(err) {
        if(err) { return next(err); }
        // Successful = so redirect to bookinstance list
        res.redirect('../../bookinstances')
    });

}

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res) {
    
    async.parallel({
        bookinstance: function(callback) {
            BookInstance.findById(req.params.id)
                .exec(callback);
        },
        book_list: function(callback) {
            Book.find({}).exec(callback);
        }
    }, function (err, results) {
        if(err) { return next(err); }
        if(results.bookinstance==null) {
            // No results.
            var err = new Error('Bookinstance not found');
            err.status = 404;
            return next(err);
        }
        // Success
        res.render('bookinstance_form', { title: 'Update Bookinstance', book_list: results.book_list, bookinstance: results.bookinstance });
    });

};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [

    // Validate fields
    body('book', 'Book must be specified').trim().isLength({ min: 1 }),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }),
    body('due_back', 'Invalid due back date').optional({ checkFalsy: true }).isISO8601(),
    body('status', 'Status must be specified').trim().isLength({ min: 1 }),

    // Sanitize fields
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('due_back').toDate(),
    sanitizeBody('statsu').escape(),

    // Work with validated and sanitized data
    (req, res, next) => {

        const errors = validationResult(req);

        var bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            due_back: req.body.due_back,
            status: req.body.status,
            _id: req.params.id
        })

        if(!errors.isEmpty()) {
            res.render('bookinstance_form', { title: 'Update Bookinstance', book_list: results.book_list, bookinstance: results.bookinstance, errors: errors.array() });
            return;
        }
        else {
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function (err, thebookinstance) {
                if (err) { return next(err); }
                // Successful redirect to new page
                res.redirect(thebookinstance.url)
            })
        }
    }
]