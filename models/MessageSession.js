const db = require("mongoose");
const User = require("./User");
const Message = require("./Message");



//may latter add a reference to a job, but right now I'm leaving it open for communications not related to a specific job.
const messageSessSchema = new db.Schema({
    active: {
        type: Boolean,
        defualt: true
    },
    messages: [{
        type: db.Schema.Types.ObjectId,
        ref: "Message"
    }],
    users: [{
        type: db.Schema.Types.ObjectId,
        ref: "User"
    }]

});
//async here may not be neccesary or may break things
messageSessSchema.pre("save", async function(next){

    try{
        if(this.isNew){
        //take list of user ids and add add this.id to their sessions list.
        // let firstMessage = await db.Message.findById(this.messages[0]);
        this.users.forEach(async (item)=>{
            let user =  await User.findById(item._id);
            // if(user + "" !== firstMessage.user+""){
                    user.notifs_type.push("session");
                    user.notifs_id.push(this.id);
            // }

            user.messageSessions.push(this.id);

            await user.save();

        })
    }else{
        //add this latter. should push to sockets?

    }
        return next();
    }catch(err){
        return next(err);
    }

    //might add ability to add new user pre hooks here, but I think I'll leave that as application logic to add a single user.


})

messageSessSchema.methods.addUserToSession = async function(parsedToken, user, next){
    try{
        let answer = this.users.some((item)=>{
            return item === parsedToken;
        });
        if(answer){
        this.users.push(user);
        console.log("HERE")
        this.save();
        }else{
        return next("invalid");
        }
        return next();
    }catch(err){
        return next(err);
    }
}

const MessageSession = db.model("MessageSession", messageSessSchema);

module.exports = MessageSession;
