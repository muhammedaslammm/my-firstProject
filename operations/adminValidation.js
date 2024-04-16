const adminValidation = function(req,res,next){
    const adminID = req.session.adminID;
    if(adminID){
        next()
    }
    else{
        res.redirect('/admin/adminlogin')
    }
}

module.exports = adminValidation

