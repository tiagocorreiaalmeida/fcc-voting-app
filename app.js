require("dotenv").config();
const express = require("express");
const expressValidator = require("express-validator");
const bodyParser = require("body-parser");
const hbs = require("hbs");
const passport = require("passport");
const session = require("express-session");
const GithubStrategy = require("passport-github");
const FacebookStrategy = require("passport-facebook");
const moment = require("moment");
const MongoStore = require("connect-mongo")(session);

const mongoose = require("./config/mongoose.js");
const Poll = require("./models/poll");
const poll = require("./routes/poll");
const User = require("./models/user");
const user = require("./routes/user");
const authenticated = require("./middleware/auth");

const app = express();

app.set("views",__dirname+"/views");
app.set("view engine","hbs");

app.use(express.static(__dirname+"/public"));
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use(session({
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:false,
    store: new MongoStore({
        mongooseConnection:mongoose.connection
    })
}));

passport.use(new GithubStrategy({
    clientID:process.env.GIT_ID,
    clientSecret:process.env.GIT_SECRET,
    callbackUrl:"http://localhost:3000/auth/github/callback"
},(accessToken,refreshToken, profile,done)=>{
    User.findOne({oauthID:profile.id}).then((user)=>{
        if(user){
            return(null,user);
        }else{
            let newUser = new User({
                oauthID:profile.id,
                name:profile.displayName,
                image:profile.photos[0].value,
                social:profile.provider,
                createdAt:moment().format("Do MMMM YYYY"),
            });
            newUser.save().then((data)=>{
                return(null,user);
            }).catch((e)=>{
                console.log(e);
            });
        }
    }).catch((e)=>{
        console.log(e);
    });
    return done(null,profile);
}
));     

passport.use(new FacebookStrategy({
    clientID: process.env.FB_ID,
    clientSecret: process.env.FB_SECRET,
    callbackURL:"http://localhost:3000/auth/facebook/callback"
},(accessToken,refreshToken, profile,done)=>{
    User.findOne({oauthID:profile.id}).then((user)=>{
        if(user){
            return(null,user);
        }else{
            let newUser = new User({
                oauthID:profile.id,
                name:profile.displayName,
                image:"https://www.1plusx.com/app/mu-plugins/all-in-one-seo-pack-pro/images/default-user-image.png",
                social:profile.provider,
                createdAt:moment().format("Do MMMM YYYY"),
            });
            newUser.save().then((data)=>{
                return(null,user);
            }).catch((e)=>{
                console.log(e);
            });
        }
    }).catch((e)=>{
        console.log(e);
    });
    return done(null,profile);
}
)); 

app.use(passport.initialize());
app.use(passport.session());  
app.use((req,res,next)=>{
    res.locals.isAuthenticated = req.isAuthenticated();
    next();
});

passport.serializeUser((user,done)=>{
    done(null,user.id);
});

passport.deserializeUser((id,done)=>{
    User.findOne({oauthID:id}).then((data)=>{
        done(null,data);
    }).catch((e)=>{
        console.log(e);
    })
}); 

app.use(expressValidator({
    errorFormatter: ((param,msg,value)=>{
        var namespace = param.split(".");
        var root = namespace.shift();
        var formParam = root;
        while(namespace.length){
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param:formParam,
            msg,
            value
        }
    })
}));

hbs.registerPartials(__dirname+"/views/partials");
hbs.registerHelper("json",(context)=>{
    return JSON.stringify(context);
});

app.get("/auth/github",passport.authenticate("github"));
app.get("/auth/github/callback", passport.authenticate("github",{failureRedirect:"/"}),(req,res)=>{
    res.redirect("/");
});
app.get("/auth/facebook",passport.authenticate("facebook"));
app.get("/auth/facebook/callback",passport.authenticate("facebook",{failureRedirect:"/"}),(req,res)=>{
    res.redirect("/");
});

app.get("/",(req,res)=>{
    Poll.find({}).sort({'_id': -1}).then((polls)=>{
        if(polls){
            res.render("index",{polls});
        }else{
        res.render("index");
        }
    }).catch((e)=>{
        console.log(e);
    })
});

app.use("/poll",poll);
app.use("/user",user);

app.get("/logout",(req,res)=>{
    req.logout();
    req.session.destroy();
    res.redirect("/");
});

app.listen(3000,()=>{
    console.log("Running on port 3000");
});