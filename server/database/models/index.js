const Sequelize = require('sequelize'); //클래스
const User = require('./user');
const Keyword = require('./keyword');
const Session = require('./session');

const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

const sequelize=new Sequelize(config.database, config.username, config.password,config);
db.sequelize=sequelize;

db.User=User;
db.Keyword=Keyword;
db.Session=Session;

User.init(sequelize);
Keyword.init(sequelize);
Session.init(sequelize);

User.associate(db);
Keyword.associate(db);
Session.associate(db);

module.exports = db;