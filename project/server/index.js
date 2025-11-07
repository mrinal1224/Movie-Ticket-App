// Import the Express framework, which is used to create a web server and handle HTTP requests
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')

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

// Enable the app to automatically parse incoming JSON request bodies
app.use(express.json())

app.use(cors({
    origin:"http://localhost:5173"
}))

app.use(cookieParser())

// Mount all routes defined in userRoutes under the '/api/auth' path
// Example: a route defined as '/login' in user.route.js will become '/api/auth/login'
app.use('/api/auth', userRoutes)

// Start the server on port 8001 and run the callback function once the server starts successfully
app.listen(8001, () => {
    // Print a message to the console indicating that the server is running
    console.log('Server Started')
})
