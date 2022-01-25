const passport = require('passport');
const GoogleStrategy = require( 'passport-google-oauth20' ).Strategy
const User = require('../models/User');
const path = require('path');
require('dotenv').config({path: path.join(__dirname, "../credentials/.env")}); //dir수정

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    })
});

passport.use(new GoogleStrategy({
        clientID: process.env.OAUTH2_GOOGLE_CLIENT_ID,
        clientSecret: process.env.OAUTH2_GOOGLE_CLIENT_SECRET_ID,
        callbackURL: '/auth/google/callback'
    }, async (accessToken, refreshToken, profile, done) => {
        // MongoDB    
        try {
            let user = await User.findOne({googleId: profile.id})
            if (user){
                done(null, user);
            }else{
                const newUser = {
                    googleId: profile.id,
                    displayName: profile.displayName,
                    firstName: profile.name.givenName,
                    lastName: profile.name.familyName,
                    image: profile.photos[0].value,
                    youtubeKeyword:[],
                    newsKeyword:[],
                    stockKeyword:[]
                }
                user = await User.create(newUser);
                done(null, user);
            }
        } catch (err) {
            console.error(err)
        }
    }
));

module.exports = passport;