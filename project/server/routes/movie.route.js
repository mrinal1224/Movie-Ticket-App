const express = require('express')
const Movie = require('../models/movie.model.js')


const movieRouter = express.Router(); // Route


// Add a Movie

movieRouter.post('/add-movie' , async(req , res)=>{
   try {
     const newMovie = new Movie(req.body)
     await newMovie.save()
       res.send({
            success: true,
            message: 'New movie has been added!'
        })
   } catch (error) {
         res.send({
            success: false,
            message: 'Movie Could not be added'
        })
   }
})

// update movie
// Delete Movie

// get all Movies
// get a specific Movie



module.exports =movieRouter;




