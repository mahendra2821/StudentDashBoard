const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    enrollmentNumber : {type:String, unique: true, required: true},
    password: {type: String , required: true},
    name:{ type: String , required: true,},
    course: {type: String , required: true}
}) ;


module.exports = mongoose.model('StudentInfo' , userSchema); 
