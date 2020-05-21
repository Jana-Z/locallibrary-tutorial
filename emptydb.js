var async = require('async')

var Book = require('./models/book')
var Author = require('./models/author')
var Genre = require('./models/genre')
var BookInstance = require('./models/bookinstance')

// Get arguments passed on command line
var userArgs = process.argv.slice(2);

var mongoose = require('mongoose');
var mongoDB = userArgs[0];
mongoose.connect(mongoDB, { useNewUrlParser: true });
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

function book_remove(cb){
    Book.remove({}, function(err) { 
        console.log('Book removed')
        cb();
    });
}

function author_remove(cb){
    Author.remove({}, function(err) { 
        console.log('Author removed')
        cb(); 
    });
}

function genre_remove(cb){
    Genre.remove({}, function(err) { 
        console.log('Genre removed')
        cb();
    });
}

function bookInstance_remove(cb){
    BookInstance.remove({}, function(err) { 
        console.log('BookInstance removed')
        cb();
    });
}

async.series([
    book_remove,
    author_remove,
    genre_remove,
    bookInstance_remove,
],
// Optional callback
function(err, results) {
    if (err) {
        console.log('FINAL ERR: '+err);
    }
    // All done, disconnect from database
    mongoose.connection.close();
});