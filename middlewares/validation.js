const User = require("./../models/userModel");

exports.authentication = async function(req,res,next){
    if(req.session.userID){
        const userID = req.session.userID;
        const userData = await User.findOne({_id:userID});
        console.log(userData);
        if(!userData){
            req.session.destroy(function(error){
                if(error){
                    console.log("No user found! session failed to destroy");
                }
                else{
                    console.log("No user Found! session destroyed");
                }
                
            })
        }
        else if(userData && userData.isBlocked){
            console.log("user is blocked. cannot access the page");
            req.session.destroy(function(error){
                if(error){
                    console.log("failed to destroy the session",error);
                    res.redirect("/login")
                }
                else{
                    console.log("session destroyed");
                    res.redirect("/login")
                }
            })
        }
        else{
            next();
        }
    }
    else{
        console.log("session expired");
        res.redirect("/login")
    }
}

