const Campground = require('../models/campground');
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({accessToken: mapBoxToken});
const { cloudinary } = require('../cloudinary');

module.exports.index = async(req, res) =>{
    const campgrounds = await Campground.find({})
    res.render('campgrounds/index', {campgrounds})
}

module.exports.renderNewForm = (req, res)=>{
    res.render('campgrounds/new')
}

module.exports.createCampground =  async(req, res, next)=>{
    const geodata = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 2
      }).send()

    const campgrounds = new Campground(req.body.campground);
    campgrounds.geometry = geodata.body.features[0].geometry;
    campgrounds.images =  req.files.map(f =>({url: f.path, filename: f.filename}));
    campgrounds.author = req.user._id;
    await campgrounds.save();
    console.log(campgrounds);
    req.flash('success','Campground Successfully added!');
    res.redirect(`/campgrounds/${campgrounds._id}`);
}

module.exports.showCampground =  async(req, res) =>{
    const campgrounds = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if(!campgrounds){
        req.flash('error','Cannot find this item!')
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', {campgrounds});
}

module.exports.renderEditForm = async(req, res)=>{
    const{id} = req.params;
    const campgrounds = await Campground.findById(id)
    if(!campgrounds){
        res.flash('error','Cannot find this item!')
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', {campgrounds});
}

module.exports.updateCampground = async(req, res)=>{
    const {id} = req.params;
    console.log(req.body);
    const campground = await Campground.findByIdAndUpdate(id,{...req.body.campground});
    const imgs =  req.files.map(f =>({url: f.path, filename: f.filename}));
    campground.images.push(...imgs);
    if(req.body.deleteImages){
        for(let filename of req.body.deleteImages){

            await cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    
    await campground.save();
    req.flash('success','Successfully updated campground');
    res.redirect(`/campgrounds/${campground._id}`);
}

module.exports.deleteCampground =  async(req, res)=>{
    const {id} = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('succes', 'Campground Has been deleted')
    res.redirect('/campgrounds');
}