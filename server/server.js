// '/' directory

const express = require("express");
const cors = require("cors");
const cookieParser = require('cookie-parser');
const passport = require('passport');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require(`path`);
const connectDB = require('./config/db');

// credentials
require('dotenv').config({path: path.join(__dirname, "../credentials/.env")}); //dir수정

// Mongoose
connectDB();

const api = require('./routes/api');
const auth = require('./routes/auth');
const database = require('./routes/database');

const app = express();
const port = process.env.PORT || 8001;

// Sessions
app.set('trust proxy');
app.use(
    session({
        secret:'keyboard cat', 
        resave: false, 
        saveUninitialized:false,
        proxy:true,
        cookie: { 
            secure: false, 
            maxAge: new Date(Date.now() + 3600000) ,
            httpOnly:false,
        }, 
        store: MongoStore.create({ //session 저장장소
            mongoUrl: process.env.MONGO_URI
        }),
    
    })
);

app.use(express.json()); // Express v4.16.0 기준 built-in body-parser 포함
app.use(express.urlencoded({extend:true}));
app.use(cors({
    origin: 'http://localhost:8000',
    credentials: 'true'
}));
app.use(cookieParser('keyboard cat'));

// passport setting
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api', api);
app.use('/auth', auth);
app.use('/database', database);

app.listen(port, () => {
    console.log(`express is running on ${port}`);
});