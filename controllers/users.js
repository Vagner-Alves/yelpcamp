const User = require('../models/user');

module.exports.renderRegister =  (req, res)=>{
    res.render('../views/users/register')
}

module.exports.register = async(req, res, next)=>{
    try{
        const {email, username, password} = req.body;
        const user = new User({email, username});
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err =>{
            if(err) return next(err)
            req.flash('success','welcome to yelpcamp');
            res.redirect('/campgrounds');
        })

    } catch(e){
        req.flash('error',e.message)
        res.redirect('/register')
    }
    
}

module.exports.renderLogin = (req, res)=>{
    res.render('users/login');
}

module.exports.login = (req, res)=>{
    req.flash('success','welcome Back');
    const redirecturl = req.session.returnTo ||'/campgrounds';
    res.redirect(redirecturl);
}

module.exports.logout = function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      req.flash('success','Succesfully Logout')
      res.redirect('/campgrounds');
    });
  }