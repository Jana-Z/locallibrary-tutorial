var mongoose = require('mongoose')

var Schema = mongoose.Schema

var GenreSchema = new Schema (
    {
        name: {type: String, required: true, min: 3, max: 3}
    }
)

// Virtual for Genre's URL
GenreSchema
.virtual('url')
.get(function() {
    return 'genre/' + this._id
})

// Export model
module.exports = mongoose.model('Genre', GenreSchema)