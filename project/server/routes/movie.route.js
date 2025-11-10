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

movieRouter.put('/update-movie/:id' , async(req , res)=>{
    try {
     const movieId = req.params.id
     const movie = await Movie.findByIdAndUpdate(movieId , req.body)
       res.send({
            success: true,
            message: 'The movie has been updated!',
            data: movie
        })
    } catch (error) {
           res.send({
            success: false,
            message: 'Server Error'
        })
    }

})




// Delete Movie

movieRouter.delete('/delete-movie/:id' , async(req , res)=>{
    try {
     const movieId = req.params.id
     const movie = await Movie.findByIdAndDelete(movieId , req.body)
       res.send({
            success: true,
            message: 'The movie has been updated!',
            data: movie
        })
    } catch (error) {
           res.send({
            success: false,
            message: 'Server Error'
        })
    }

})


// get all Movies
movieRouter.get('/all-movies' , async(req , res)=>{
      try {
         const allMovies =  await Movie.find()
         res.send({
            success: true,
            message: 'All movies have been fetched!',
            data: allMovies
        });

      } catch (error) {
          res.send({
            success: false,
            message: error.message
        });
      }
})

// get a specific Movie

movieRouter.get('/:id' , async(req , res)=>{
    try {
        const movie = await Movie.findById(req.params.id)
         res.send({
            success: true,
            message: "Movie fetched successfully!",
            data: movie
        })
    } catch (error) {
           res.send({
            success: false,
            message: err.message
        })
    }
})





module.exports =movieRouter;




