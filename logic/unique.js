const db = require('../models')


exports.checkEmail = async (req, res, next) => {
    try{
        const answer = await db.User.findOne({'email': req.body.email});

        return res.status(200).json({taken: !!answer});
    }catch(err){
        return next(err);
    }
}

exports.checkUser = async (req, res, next) => {
    try{
        const answer = await db.User.findOne({'username': req.body.username})

        return res.status(200).json({taken: !!answer});
    }catch(err){
        return next(err);
    }
}
