exports.errorBridge = function(err, req, res, next){
    return res.status(err.status || 500).json({
        error: {
            message: err.message || "Oh no.. The world is built on toothpicks. Contact the internet gods"
            // message: "Oh no.. The world is built on toothpicks. Contact the internet gods"
        }
    });

}
