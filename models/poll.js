const mongoose = require("mongoose");

var PollSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true,
        trim: true,
        minlength:1,
        unique: true,
    },
    author:{
        type:String,
        required: true,
    },
    createdAt:{
        type:String,
        required:true
    },
    options:[{
            title:{
                type:String,
                required:true,
                trim:true,
            },
            votes:{
                type:Number,
                default:0
            }
    }],
    votedBy:{
        user:[],
        ip:[]
    }
});

var Poll = mongoose.model("Poll",PollSchema);

module.exports = Poll;