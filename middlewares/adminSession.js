const session = require('express-session');
const MongoStore = require('connect-mongodb-session')(session)

const store = new MongoStore({
    uri:"mongodb://localhost:27017/moasWebsite",
    collection:"adminSession"
})

store.on('error',function(error){
    console.log('admin session store error',error);
})

const adminSession = session({
    name:'admin.sid',
    secret:'adminSessionSecret',
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
        path: '/admin', 
        maxAge: 1000 * 60 * 60 * 24 
    }
})

module.exports = adminSession;