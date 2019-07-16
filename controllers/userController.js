const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');


exports.registerForm = (req, res) => {
    res.render('register', { title: 'Register' });
}; 

exports.loginForm = (req, res) => {
    res.render('login', { title: 'Login' });
};

//validate the user form data
exports.validateRegister = (req, res, next) => {
    req.sanitizeBody('name');
    req.checkBody('name', 'You must enter a name!').notEmpty();
    req.checkBody('email', 'Not a valid Email!').isEmail();
    req.sanitizeBody('email').normalizeEmail({
        remove_dots: false,
        remove_extension: false,
        gmail_remove_subaddress: false
    });

    req.checkBody('password', 'You must enter a password!').notEmpty();
    req.checkBody('password-confirm', 'You must confirm a password!').notEmpty();
    req.checkBody('password-confirm', 'Oops! Your passwords don\'t match').equals(req.body.password);

    const errors = req.validationErrors();
    if(errors) {
        req.flash('error', errors.map(err=> err.msg));
        res.render('register', { title: 'Register', body: req.body, flashes: req.flash() });
        return; //stop the function
    }
    next(); // go to next middleware there are no errors

};
// register the user
exports.register = async (req, res, next) => {
    const user = new User({ email: req.body.email, name: req.body.name });
    const register = promisify(User.register, User);
    await register(user, req.body.password);
    next(); // pass to authController.login
};

exports.account = (req, res) => {
    res.render('account', { title: 'Edit Your Account'});
};

exports.updateAccount = async (req, res) => {
    const updates = {
        name: req.body.name,
        email: req.body.email
    };

    const user = await User.findOneAndUpdate(
        { _id: req.user._id },
        { $set: updates },
        { new: true, runValidators: true, context: 'query' }
    );

    req.flash('success', 'Updated Successfully!!!');
    res.redirect('back');
};

