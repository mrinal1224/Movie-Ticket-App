// Import the Express framework, which is used to create a web server and handle HTTP requests
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')

// Import the database configuration file that contains connection logic for the database
const dbConfig = require('./dbConfig.js')

// Import the dotenv package to load environment variables from a .env file
const dotEnv = require('dotenv')

// Load the environment variables from the .env file into process.env
dotEnv.config()

// Create an instance of an Express application
const app = express()

// Call the connectDb() function from dbConfig.js to establish a connection to the database
dbConfig.connectDb()

// Import user-related routes from the user.route.js file
const userRoutes = require('./routes/user.route.js')
const movieRoutes = require('./routes/movie.route.js')
const theatreRoutes = require('./routes/theatre.route.js')
const showRoutes = require('./routes/show.routes.js')
const bookingRoutes = require('./routes/booking.route.js')

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
	message: 'Too many Requests from this IP , Try Again in  15 minutes'

})


// Enable the app to automatically parse incoming JSON request bodies
app.use(express.json())

app.use(cors({
    origin:"http://localhost:5173",
    credentials : true
}))

app.use(cookieParser())

app.use(limiter)
app.use(mongoSanitize());

// Mount all routes defined in userRoutes under the '/api/auth' path
// Example: a route defined as '/login' in user.route.js will become '/api/auth/login'
app.use('/api/auth', userRoutes)
app.use('/api/movie', movieRoutes)
app.use('/api/theatre',theatreRoutes)
app.use('/api/shows' , showRoutes)
app.use('/api/booking', bookingRoutes)

// Start the server on port 8001 and run the callback function once the server starts successfully
app.listen(8001, () => {
    // Print a message to the console indicating that the server is running
    console.log('Server Started')
})
