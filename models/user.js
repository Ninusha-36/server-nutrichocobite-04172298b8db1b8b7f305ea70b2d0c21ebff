const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator').default;

const Schema = mongoose.Schema;

const userScheme = new Schema({
    username : {type : String, required: true},
    email : {type : String, required: true, unique: true},
    phone : {type : Number, required: true, unique: true},
    password : {type : String, required: true, minlength:6},
    type:  {type : String, required: true},
    profile: {type : String},
    gender: {type : Number},
})

userScheme.plugin(uniqueValidator)


module.exports = mongoose.model('User', userScheme);