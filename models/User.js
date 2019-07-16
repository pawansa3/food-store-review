// 3 for database connection to mongoose
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
// for md5 password encryption
const md5 = require('md5');
//for form data validation
const validator = require('validator');
//for databse error handling
const mongodbErrorHandler = require('mongoose-mongodb-errors');
// for password handling
const passportLocalMongoose = require('passport-local-mongoose');

//creating user model for user database

const userSchema = new Schema({
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'Invalid Email Address'],
        required: 'Please enter an email address'

    },
    name: {
        type: String,
        trim: true,
        required: 'Please enter a name'
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    hearts: [
        { type: mongoose.Schema.ObjectId, ref: 'Store' }
    ]
});

userSchema.virtual('gravatar').get(function() {
    const hash = md5(this.email);
    return `https://gravatar.com/avatar/${hash}?s=200`;    
})

userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });
userSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model('User', userSchema);


