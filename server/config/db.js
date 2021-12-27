const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({path: path.join(__dirname, "../credentials/.env")}); //dir수정

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            dbName:'toast',//mongoose 6.0 이상에서는 useNewUrlParser, useUnifiedTopolgy true로 제공
            // useFindAndModify: false -> mongoose 6.0 이상에서는 항상 false라서 더이상 지원하지 않는다 함
        })
        console.log(`mongoDB Connect: ${conn.connection.host}`)
    } catch (err) {
        console.error(err)
        process.exit(1)
    }
}

module.exports = connectDB