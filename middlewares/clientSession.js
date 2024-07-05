const session = require('express-session');
const MongoStore = require('connect-mongodb-session')(session)

const store = new MongoStore({
    uri:"mongodb://localhost:27017/moasWebsite",
    collection:"clientSession"
})

store.on('error',function(error){
    console.log('client session store error',error);
})

const userSession = session({
    name:'client.sid',
    secret:'clientSessionSecret',
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
        path: '/', 
        maxAge: 1000 * 60 * 60 * 24 
    }
})

module.exports = userSession;