# Locallibrary tutorial
My implementation of [Mozilla's Node and Express Tutorial](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/Tutorial_local_library_website)

## Setup
clone git repo.
To install all development dependencies run `npm install`.
Create a `.env` file in the root and insert `MONGO_URI='<your URI>'` as the first line.
Run `node populateddb '<your URI>'` to populate the database.  
(You can wipe it again by running `node emptydb '<your URI>'`)
Run `npm run serverstart` or `npm start` to run the app.

## Technologies
Build according to [Mozilla's Node and Express Tutorial](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/Tutorial_local_library_website)
using:  
- Node.js
- Express
- Mongoose / MongoDb
- Pug  
The `.gitignore` is from [this repo](https://github.com/github/gitignore/blob/master/Node.gitignore)

## Features
This site features a basic database for a locallibrary.
It includes Authors, Books, Genres, Bookinstances.  
New instances can be created, existing ones can be updated or deleted and you can filter and sort the database.

## FIle structure
All `.pug` files lie in `views/`.  
`routes/` features multiple Routers. (Currently only the `catalogRouter.js` id really used)  
The datatypes can be find in the `models/`folder.  
`controllers/` features all controllers to handles get / post requests.  

## Data Structure
### Genres
- name
- (_id)  

Virtual:
- url

### Bookinstances
- book
- status
- imprint
- due_back
- (_id)  

Virtuals:
- due_back_formatted
- url

### Book
- title
- author
- summary
- isbn
- genre
- (_id)

Virtual:
- url

### Author
- first_name
- last_name
- date_of_birth
- date_of_death
- (_id)  

Virutals:
- lifespan
- name
- date_of_birth_formatted
- date_of_death_formatted
- url