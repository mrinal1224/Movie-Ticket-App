const Movie = require('../models/movie.model.js')

 const addMovie = async(req , res)=>{
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
}

 const updateMovie = async(req , res)=>{
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

}

module.exports={
    addMovie , updateMovie
}