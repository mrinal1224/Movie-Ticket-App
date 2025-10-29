const express = require('express')
const dbConfig = require('./dbConfig.js')
const dotEnv = require('dotenv')
dotEnv.config()
const app = express()
dbConfig.connectDb()

const userRoutes = require('./routes/user.route.js')
app.use(express.json())
app.use('/api/auth' , userRoutes)

app.listen(8001 , ()=>{
    console.log('Server Started')
})



