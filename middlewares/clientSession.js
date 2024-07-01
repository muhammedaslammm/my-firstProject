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
    secret:'clientSessionSecret',
    resave: false,
    saveUninitialized: false,
    store
})

module.exports = userSession;