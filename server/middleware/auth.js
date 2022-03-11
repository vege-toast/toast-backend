exports.isLogin = (req, res, next) => {
    if(req.isAuthenticated()){
        next();
    }
    else {
        res.status(401).send("Unauthorized Access");
    }
}

