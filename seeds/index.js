const mongoose = require('mongoose');
const cities = require('./cities')
const {places, descriptors} = require('./seedHelpers');
const campground = require('../models/campground');


// mongodb logic from models/campground file

// this file will also delete all entries on the dataBase and add new ones whenever I need to do this operation

mongoose.connect('mongodb://localhost:27017/yelp-camp4',{
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection;
db.on("error",console.error.bind(console, "connection error:"));
db.once("open",()=>{
    console.log("database connected");
});

const sample = array => array[Math.floor(Math.random() *array.length)];

const seedDB = async() => {
    await campground.deleteMany({});
    for(let i = 0; i < 200; i++){
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new campground({
            author: "63efbee9f0a47d90cc3894bf",
            location: `${cities[random1000].city},${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            geometry:{
                type:"Point",
                coordinates: [
                cities[random1000].longitude, 
                cities[random1000].latitude
            ]
            },
            images: [
                {
                    url: 'https://res.cloudinary.com/dwsu2axvz/image/upload/v1674743356/Yelpcamp/atan2exfv2ig1gjb789y.jpg',
                    filename: 'Yelpcamp/atan2exfv2ig1gjb789y',
                    
                  },
                  {
                    url: 'https://res.cloudinary.com/dwsu2axvz/image/upload/v1674743357/Yelpcamp/dn5gzmutntynzrhk0wtg.png',
                    filename: 'Yelpcamp/dn5gzmutntynzrhk0wtg',
                    
                  }
            ],
            description: 'Take a look at Some campgrounds taken over all of united states',
            price
        }
        )
        await camp.save();

    }
}

seedDB().then(() =>{
    db.close()
})