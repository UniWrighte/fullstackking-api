require("dotenv").load();
const jwt = require("jsonwebtoken");
const db = require("../models");

//need to change this name to adminAuthorize.
exports.adminAuthorize = async function(req, res, next){
    try{
        const {id} = req.params;
        const token = req.headers.authorization.split(" ")[1];
        jwt.verify(token, process.env.ADMIN_KEY, async function(error, decoded){
            try{
            if(decoded && decoded.id === id){
                const adminCheck = await db.Admin.findById(id);
                if(!!adminCheck){
                    return next();
                }else{
                    return next({
                         status: 401,
                         message: "Unauthorized"
                     });
                }
            }
        }catch(err){
            return next(err);
        }
        });
    }catch(err){
        return next({
            status: 401,
            message: "Unauthorized"
        });
    }
}


exports.Authenticate = function(request, response, next){

    try{
        const headers = request.headers.authorization.split(" ");
        const token = headers[1];


        jwt.verify(token, process.env.SECRET_KEY, function(error, decoded){
            if(decoded){

                return next();
            }else{
                return next({
                    status: 401,
                    message: "Please log into your account"
                });
            }
        });
    }catch(err){

        return next({
            status: 401,
            message: "Please log into your account"
        });
    }
}
exports.adminAuthenticate = async function(req, res, next){
    try{
        const token = req.headers.authorization.split(" ")[1];
        jwt.verify(token, process.env.ADMIN_KEY, function(error, decoded){
            if(decoded){
                return next()
            }else{
                return next({
                    status: 401,
                    message: "Login required"
                });
            }
        });
    }catch(err){
        return next({
            status: 401,
            message: "Please log in."
        });
    }
}

exports.Authorize = function(request, response, next){

    try{
        const token = request.headers.authorization.split(" ")[1];
        jwt.verify(token, process.env.SECRET_KEY, function(error, decoded){

            if(decoded && decoded.id === request.params.id && !decoded.resetToken){

                return next();
            }else{
                return next({
                    status: 401,
                    message: "Unauthorized"
                });
            }
        })
    }catch(err){
        return next({
            status: 401,
            message: "Unauthorized"
        });
    }
};
