const db = require("mongoose");
db.set("debug", true);
db.Promise = Promise;
//TODO - change this to .env loaded url for database
db.connect("mongodb://localhost/fullstack-user",
            {keepAlive: true}).catch((err)=>{
                console.log("huh?")
            });


module.exports.User = require("./User");
module.exports.Job = require("./Job");
module.exports.Bid = require("./Bid");
module.exports.Message = require("./Message");
module.exports.MessageSession = require("./MessageSession");
module.exports.Payment = require("./Payment");
module.exports.Review = require("./Review");
module.exports.Payout = require("./Payout");
module.exports.Support = require("./Support")
module.exports.Admin = require("./Admin");
module.exports.Blog = require("./Blog");
