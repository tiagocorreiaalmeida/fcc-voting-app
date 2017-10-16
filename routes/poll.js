const express = require("express");
const router = express.Router();
const moment = require("moment");
const authenticated = require("../middleware/auth");
const {ObjectID} = require("mongodb");

const Poll = require("../models/poll");

router.get("/my",authenticated,(req,res)=>{
    Poll.find({author:req.user._id}).then((polls)=>{
        if(polls){
            res.render("my_polls",{polls});
        }else{
            res.render("my_polls");
        }
    }).catch((e)=>{
        console.log(e);
    })
});


router.get("/new",authenticated,(req,res)=>{
    res.render("add_poll");
})

router.post("/new",authenticated,(req,res)=>{
    req.checkBody("title","Title is required").notEmpty();
    req.checkBody("options","Options are required").notEmpty();
    let errors = req.validationErrors();
    if(errors){
        console.log(errors);
        res.render("add_poll.hbs",{errors});
    }else{
        let title = req.body.title;
        let optionsSplit = req.body.options.match(/([^,\s][^\,]*[^,\s]*)/g);
        let options= [];
        let author = req.user._id;
        for(let i=0; i <optionsSplit.length; i++){
            options.push({
                title:optionsSplit[i]
            });
        }
        console.log(options);
        Poll.findOne({title}).then((data)=>{
            if(data){
                let error = "A poll with the same title allready exists";
                res.render("add_poll.hbs",{error});
            }else{
                let newPoll = new Poll({
                    title,
                    author,
                    createdAt:moment().format("Do MMMM YYYY"),
                    options
                });
                newPoll.save().then((data)=>{
                    console.log("success do something else");
                    res.redirect("/poll/"+data._id);
                }).catch((e)=>{
                    console.log(e);
                })
            }
            }).catch((e)=>{
            console.log(e);
        });
    }
});

router.get("/:id",(req,res)=>{
    Poll.findById(req.params.id).then((poll)=>{
        if(!poll){
            res.render("404");
        }else{
            res.render("poll",{polldata: poll.toObject()});
        }
    }).catch((e)=>{
        console.log(e);
    });
});

router.post("/add/:id",(req,res)=>{
    req.checkBody("title","Title is required").notEmpty();
    let errors = req.validationErrors();
    if(errors){
        res.render("poll",errors);
    }
});

router.post("/:id",(req,res)=>{
    let _id = ObjectID(req.params.id);
    let ip = req.ip;
    let user = "anonymous";
    if(req.isAuthenticated()){
        user = req.user._id;
    }
    Poll.findOne({_id,$or:[{"votedBy.user":user},{"votedBy.ip":ip}]}).then((result)=>{
        if(result){
            console.log("allready voted");
        }else{
            Poll.findOneAndUpdate({_id, "options.title":req.body.select},{$inc:{"options.$.votes":1},$push:{"votedBy.$.user":user,"votedBy.$.ip":ip}}).then((data)=>{
                if(data){
                    res.redirect(data._id);
                }else{
                    res.redirect("/");
                }
            }).catch((e)=>{
                console.log(e);
            });
        }
    }).catch((e)=>{
        console.log(e);
    });
});

module.exports = router;

