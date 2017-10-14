const express = require("express");
const router = express.Router();
const moment = require("moment");
const authenticated = require("../middleware/auth");

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
        let optionsSplit = req.body.options.match(/(\w+)/g);
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
                errors.message = "A poll with the same title allready exists";
                res.render("add_poll.hbs",errors);
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
            res.render("poll",poll);
        }
    }).catch((e)=>{
        console.log(e);
    });
});

module.exports = router;