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
        Poll.findOne({title}).then((data)=>{
            if(data){
                req.flash("error","A poll with the same title allready exists");
                res.render("add_poll.hbs");
            }else{
                let newPoll = new Poll({
                    title,
                    author,
                    createdAt:moment().format("Do MMMM YYYY"),
                    options
                });
                newPoll.save().then((data)=>{
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
    let url = req.protocol + '://' + req.get('host') + req.originalUrl;
    Poll.findById(req.params.id).then((poll)=>{
        if(!poll){
            res.render("404");
        }else{
            poll.toObject();
            poll.url = encodeURI(url);
            if(req.user && req.user._id.toString() === poll.author.toString()){
                poll.owner = true;
            }
            res.render("poll",{polldata: poll});
        }
    }).catch((e)=>{
        console.log(e);
    });
});

router.post("/:id",(req,res)=>{
    let _id = ObjectID(req.params.id);
    let ip;
    if (req.headers['x-forwarded-for']) {
        ip = req.headers['x-forwarded-for'].split(",")[0];
    } else if (req.connection && req.connection.remoteAddress) {
        ip = req.connection.remoteAddress;
    } else {
        ip = req.ip;
    }
    let query;
    let query2;
    if(req.isAuthenticated()){
        query = {
            _id,
            "$or":[{"votedBy.user":req.user._id},{"votedBy.ip":ip}]
        };
        query2 = {
            "votedBy.$.user":req.user._id,
            "votedBy.$.ip":ip
        };
    }else{
        query = {
            _id,
            "votedBy.ip":ip
        }; 
        query2 = {
            "votedBy.$.ip":ip
        };
    }
    Poll.findOne(query).then((result)=>{
        if(result){
            req.flash("error","You allready voted for this poll");
            res.redirect(_id);
        }else{
            Poll.findOneAndUpdate({_id, "options.title":req.body.select},{$inc:{"options.$.votes":1},$push:query2}).then((data)=>{
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

router.post("/add/:id",(req,res)=>{
    let option = req.body.newoption.trim();
    Poll.findById(req.params.id).then((poll)=>{
        poll.toObject()
        if(poll.options.filter((ele)=>ele.title === option).length > 0){
            req.flash("error","The option you tried to create allready exists!");
            res.redirect("/poll/"+req.params.id);
        }else{
            Poll.findByIdAndUpdate(poll._id,{$push:{"options":{title:option}}},{new: true}).then((poll)=>{
                poll.toObject();
                if(req.user && req.user._id.toString() === poll.author.toString()){
                    poll.owner = true;
                }
                res.render("poll",{polldata:poll});
            }).catch((e)=>{
                console.log(e);
            });
        }
    }).catch((e)=>{
        console.log(e);
    });
});

router.post("/delete/:id",authenticated,(req,res)=>{
    Poll.findById(req.params.id).then((poll)=>{
        if(!poll || poll.author.toString() !== req.user._id.toString()){
            res.redirect("/");
        }else{
            Poll.findByIdAndRemove(poll._id).then((data)=>{
                req.flash("success","Poll deleted with success");
                res.redirect("/poll/my");
            }).catch((e)=>{
                console.log(e);
            })
        }
    }).catch((e)=>{
        console.log(e);
    })
});

module.exports = router;

