const express = require("express");
const Show = require("../models/show.model.js");

const showRouter = express.Router(); // Route

// create a show
showRouter.post("/add-show", async (req, res) => {
  try {
    const newShow = new Show(req.body);
    await newShow.save();
    res.send({
      success: true,
      message: "New show has been added!",
    });
  } catch (error) {
    res.send({
      status: false,
      message: error.message,
    });
  }
});

// Delete Show
showRouter.post("/delete-show", async (req, res) => {
  try {
    await Show.findByIdAndDelete(req.body.showId);
    res.send({
      success: true,
      message: "The show has been deleted!",
    });
  } catch (err) {
    res.send({
      status: false,
      message: err.message,
    });
  }
});

// Update show
showRouter.put("/update-show", async (req, res) => {
  try {
    await Show.findByIdAndUpdate(req.body.showId, req.body);
    res.send({
      success: true,
      message: "The show has been updated!",
    });
  } catch (err) {
    res.send({
      success: false,
      message: err.message,
    });
  }
});

// get all shows and theatres for a movie

showRouter.get("/get-all-theatres-by-movie", async (req, res) => {
     try {
            const {movie , date} = req.body
            const shows = await Show.find({movie ,date})

            // we need to map the shows with theatres
            
              
            res.send({
                success : true,
                message : 'Shows Fetched',
                shows : shows
            })
     } catch (error) {
        res.send({
            success : false,
            message : 'Shows not Fetched'
        })
     }






});


// get-show-by-id

showRouter.get('/get-show-by-id' , async(req , res)=>{
    try {
        const show = Show.findById(req.body.showId)
        res.send({
            success: true,
            message: 'Show fetched!',
            data: show
        });

    } catch (error) {
        res.send({
            success: false,
            message: error.message
        })
    }
})


showRouter.post('/get-all-shows' ,async(req , res)=>{
    try {
        const allShows = await Show.find({theatre:req.body.thearteId }).populate('movie').populate('theatre')
        res.send({
            success : true,
            message : "All Shows Fetched",
            data : allShows
        })
    } catch (error) {
        res.send({
            success : false,
            message : `Not able to fetch Shows ${error}`,
           
        })
    }
   
})




module.exports = showRouter;
