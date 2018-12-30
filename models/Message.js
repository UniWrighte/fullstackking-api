const db = require("mongoose");
const User = require("./User");
const MessageSession = require("./MessageSession");

//might add bcrypt for security using the id's of each user (or something else) to encrypt/verify
//I may also need another library to implement async encryption with public/private key pairs, but I'm not even sure all of this is neccesary
//for this app.

messageSchema = new db.Schema({
    text: {
        type: String,
        required: true
    },
    user: {
        type: db.Schema.Types.ObjectId,
        ref: "User"
    },
    session: {
        type: db.Schema.Types.ObjectId,
        ref: "MessageSession"
    },
    date:{
        type: Date,
        default: Date.now
    }
})

messageSchema.pre("save", async function(next){
try{

    let session = await MessageSession.findById(this.session).populate("users");
    await session.messages.push(this.id);

    session.users.forEach(async (user)=>{
        if(user._id+"" !== this.user+"" ){
            user.notifs_type.push("message")
            user.notifs_id.push(this.session);
        }
        await user.save();
    })

    await session.save();

    return next();
}catch(err){
    return next(err);
}

});


const Message = db.model("Message", messageSchema);
module.exports = Message;
