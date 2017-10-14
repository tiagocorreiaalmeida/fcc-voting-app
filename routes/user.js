const express = require("express");
const router = express.Router();

const authenticated = require("../middleware/auth");
const User = require("../models/user");

router.get("/me",authenticated,(req,res)=>{
    User.findById(req.user._id).then((user)=>{
        if(!user){
            res.redirect("/");
        }
        res.render("user",user);
    }).catch((e)=>{
        console.log(e);
    })
})

router.get("/remove",authenticated,(req,res)=>{
    User.findByIdAndRemove(req.user._id).then((removed)=>{
        if(removed){
            res.redirect("/logout");
        }else{
            res.redirect("/");
        }
    }).catch((e)=>{
        console.log(e);
    })
})
module.exports = router;