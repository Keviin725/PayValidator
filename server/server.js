require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const app = express()

// Ler o JSON / middlewares
app.use(
    express.urlencoded({
        extended: true
    })
)
app.use(express.json())

// Rotas da API
const router = require('./routes/routes')
app.use(router)

// Credentials
const DB_USER = process.env.DB_USER
const DB_PASSWORD = encodeURIComponent(process.env.DB_PASSWORD)

// Conectar a BD
mongoose.connect(`mongodb+srv://${DB_USER}:${DB_PASSWORD}@cluster0.gkhvgev.mongodb.net/?retryWrites=true&w=majority&appName=cluster0`)
.then(() => {
    console.log("Rocket Launched Successfully! 🚀")
    app.listen(3000)
})
.catch((err) => console.log(err))
