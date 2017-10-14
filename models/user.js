const mongoose = require("mongoose");

var UserSchema = mongoose.Schema({
    oauthID:{
        type:Number,
        required:true
    },
    name:{
        type:String
    },
    createdAt:{
            type:String,
            require:true
    },
    image:{
        type:String,
        required:true
    },
    social:{
        type:String,
        require:true
    }
})

var User = mongoose.model("User",UserSchema);
module.exports = User;