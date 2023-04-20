if(process.env.NODE_ENV !=="production"){
    require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const helmet = require('helmet');

const mongoSanitizer = require('express-mongo-sanitize');

// requiring the routes from campground and revies files
const userRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');

const MongoStore = require("connect-mongo");
 
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp4'

// mongodb logic from models/campground file
mongoose.connect(dbUrl,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

const db = mongoose.connection;
db.on("error",console.error.bind(console, "connection error:"));
db.once("open",()=>{
    console.log("database connected");
});

const app = express(); // express app logic (routes and html templating response)

app.use(express.urlencoded({extended:true})); // helps express to parse any url so we can catch its content via request.body

app.use(methodOverride('_method')); // now we can use both update, delete, patch or put request in  a html form. 

app.use(express.static(path.join(__dirname, 'public')))
app.use(mongoSanitizer({
    replaceWith:'_'
}));

app.engine('ejs',ejsMate);
app.set('view engine','ejs'); // setting the ejs engine
app.set('views', path.join(__dirname,'views'));

// using the routes we set above
const  secret = process.env.SECRET || 'thisShouldbeBetter'

const store = new MongoStore({
    mongoUrl: dbUrl,
    secret: 'thisShouldbeBetter', 
    touchAfter: 24 * 3600 });


store.on("error", function(e){
    console.log("This is an Session Error",e)
})

// this is sessions alongside cookies use in yelpcamp
const sessionConfig = {
    store,
    name:'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie:{
        httpOnly:true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig));
app.use(flash());
app.use(helmet());

const scriptSrcUrls = [
    "https://cdn.jsdelivr.net/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net/",
    "https://stackpath.bootstrapcdn.com/"
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://cdn.jsdelivr.net/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
    "https://stackpath.bootstrapcdn.com/"
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dwsu2axvz/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
                "https://cdn.dribbble.com/",
                
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

// set up the passport middleware so that we can have a login method
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next)=>{
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next()
});

// this fake route was create to test passport middleware
app.get('/fakeUser', async(req, res)=>{
    const user  = new User({email:'try2@gmail.com',username:'TryLoginMethodAgain..'});
    const newUser = await User.register(user, 'Monkey81819');
    res.send(newUser);
});

app.use('/', userRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);
app.use(express.static('public'));



app.get('/',(req, res) =>{
    res.render('home')
});

app.all('*',  (req, res, next)=>{
    next(new ExpressError('Page Not Found', 404))
});

app.use((err, req, res, next)=>{
    const {statusCode = 500} = err;
    if(!err.message) err.message = 'Something went wrong';
    res.status(statusCode).render('error',{err});
});


const port = process.env.PORT || 3000;

app.listen(port, ()=>{
    console.log(`Serving on the Port ${port}`)
})