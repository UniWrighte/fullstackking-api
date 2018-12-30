const db = require("../models");
const {idParse} = require("./helpers");


//TODO heavily filter all responses

exports.clearMessage = async function(req, res, next){
    try{
        const uid = await idParse(req.headers.authorization.split(" ")[1]);
        const {session} = req.body;
        //remove message from view.
        //return either a signal to remove client side or a new group. probably first idea.
        await db.User.findById(uid).exec((err, doc)=>{
            if(err)return res.status(400).json(err);

            doc.inactiveSessions.push(session);
            doc.messageSessions.pull(session); //still will have an issue if inactive session is updated.
            doc.save();
        });
        const mess = await db.Message.create({
            session,
            user: uid,
            text: "left session..."
        });
        await db.MessageSession.findById(session).exec((err, doc)=>{
            if(err) return res.status(400).json(err);
            doc.users.pull(uid);
            doc.users = doc.users.filter((i)=>i !== undefined);
            doc.save();
        });

        return res.status(200).json({success: "completed"});
    }catch(err){
        return next(err);
    }
}

exports.addUserToSession = async function(req, res, next){
    try{
        const uid = await idParse(req.headers.authorization.split(" ")[1]);
        const {user, session} = req.body;
        const to_u = await db.User.findById(user);

        await db.MessageSession.findById(session).exec((err,doc)=>{
            if(err) return res.status(400).json({err});
            doc.users.push(user);
            doc.save();
        })
        const created = await db.Message.create({
            session,
            user: uid,
            text: `${to_u.username} was added to the session`
        });
        await db.User.findById(user).exec((err, doc)=>{
            if(err) return res.status(400).json({err});
            doc.messageSessions.push(session); //may want to pull, but currently tracks how many times it was deactivated.
            doc.save();
        })
        console.log(created);
        return res.status(200).json(created);
    }catch(err){
        return next(err);
    }
}
exports.binMessageSession = async function(req,res,next){
    try{
        const {session_id} = req.body;
        const user = await idParse(req.headers.authorization.split(" ")[1]);
        const userDocument = await db.User.findById(user);

        userDocument.deactiveMessageSession(session_id);

        return res.status(200).json({message: "no errors binning message session"});
    }catch(err){
        return next(err);
    }
}

exports.startMessageSession = async function(req, res, next){
    try{
        let {users, initMessage} = req.body;

        if(Array.isArray(users) === false || users.length === 0 || typeof initMessage !== "string" || initMessage.length === 0){
            return res.status(400).json({error: "unfilled form"});
        }

        //when working on ui, I'll add ability to add multiple users by parsing json, but too difficult to test now.
        //let sendToUser = await db.User.findOne({"username": users});
        const sendToUsers = await users.map(async (user)=>{
            const u = await db.User.findOne({"username": user});
            return u;
        });


        const token = req.headers.authorization.split(" ")[1];
        const user = await idParse(token);

        let fromUser = await db.User.findById(user);
        Promise.all(sendToUsers).then(async (users)=>{
            console.log("here are the users", users); //probably should make a test for that so people aren't making socket sessions with themselves.
            // if(fromUser._id + "" === sendToUser._id + "") return res.status(400).json({error:"cannot send to self. This is not a notepad"});
            let userList = [fromUser, ...users];

            const newMessageSession = await db.MessageSession.create({users: userList});
            const firstMessage = await db.Message.create({
                session: newMessageSession.id,
                user,
                text: initMessage
            })//this is currently not working correctly.
            return res.status(200).json({message: "send was successful!"});

        });
    }catch(err){
        return next(err);
    }
}
exports.getMessageSessions = async function(req, res, next){
    try{

        const user = await idParse(req.headers.authorization.split(" ")[1]);

        const info = await db.User.findById(user).populate('messageSessions').exec(async (error, result)=>{
            if(result === null) return res.status(400).json({message: "currently no messages"});


            let finalResult = result.messageSessions.map(async (item)=>{
                const mostRecentMessage = await db.Message.findById(item.messages[item.messages.length-1]).populate("user"); //probably should use selection here
                const {_id, session, user, text, date} = mostRecentMessage;
                const {firstname, lastname, username, photo} = mostRecentMessage.user;

                const filteredRecentMessage = {_id, session, user: {firstname,lastname,username, photo, _id: mostRecentMessage.user._id}, text, date};


                return filteredRecentMessage;
            });




            Promise.all(finalResult).then((final)=>{

            try{

                let notifs_id = [];
                result.notifs_type = result.notifs_type.filter((item, index)=>{
                    const keep = (item !== "session");
                    keep && notifs_id.push(result.notifs_id[index]);
                    return keep;
                });
                result.notifs_id = notifs_id;
                result.save();

                return res.status(200).json(final);
            }catch(err){
                return res.status(400).json(err);
            }




            })



        });



    }catch(err){
        return next(err);
    }
}
exports.sendMessage = async function(req,res,next){
    try{
        let {text, session} = req.body;
        let token = req.headers.authorization.split(" ")[1];
        let user = await idParse(token);

        let message = await db.Message.create({
            session,
            user,
            text
        });

        return res.status(200).json({message: "send was successful!"});
    }catch(err){
        return next(err);
    }
}
exports.getMissingMessageData = async function(req, res, next){
    try{
        const {uid} = req.body;
        const user = await db.User.findById(uid);
        const {_id, username, firstname, photo} = user;
        return res.status.json({user: _id, username, firstname, photo});
    }catch(err){
        return next(err);
    }
}
//half the issue is that this needs to be a post route and not a get route for it to work correctly.
exports.getMessagesBySession = async function(req, res, next){
    try{
        const uid = await idParse(req.headers.authorization.split(" ")[1]);
        let {session_id, load_date} = req.body;
        console.log(load_date)
        const date = load_date === undefined ? new Date() : new Date(load_date);
        console.log(date)

        let session = await db.MessageSession.findById(session_id) //change bellow with read in param or add new method for it.
                            .populate('users').populate({path:'messages', match:{date: {$lte: date}}, options: {limit: 20, sort: "-date"}});
        let {messages, users} = session;
        const auth = users.some((u)=>{return u._id+"" === uid+""});

        let filteredUsers = users.map((user)=>{
            let {_id,username, firstname, photo} = user;

            return {_id,username, firstname, session_id, photo};
        });


        let returnItems = {messages, filteredUsers};
        if(auth){
        await db.User.findById(uid).exec( async (err, user)=>{
            // console.log("user obj id::", user.notifs_id);
            // console.log("session id", session_id);

            let notifs_type = [];
            user.notifs_id = user.notifs_id.filter((id, index)=>{
                const keep = id+"" !== session_id+"";
                keep && notifs_type.push(user.notifs_type[index]);
                return keep;
            });
            user.notifs_type = notifs_type;
            // console.log("beforesave::", user);
            await user.save();

        });
        return res.status(200).json(returnItems)
        }else{
        return res.status(400).json({error: "unauthorized"});
        }
    }catch(err){
        return next(err);
    }
}
exports.socketMessageAuth = async function(session_id, token, next){
    try{
        let user = await idParse(token);

        let userItem = await db.User.findById(user);

        let valid = userItem.messageSessions.some((id)=>(id + "" === session_id));

        return valid;

    }catch(err){
        return next(err);
    }
}
exports.socketMeassageAuthAndSend = async function(session_id, token, text){
    try{

        let user = await idParse(token);

        let userItem = await db.User.findById(user);
        let {username} = userItem;
        let valid = userItem.messageSessions.some((id)=>(id + "" === session_id));

        if(valid){
            let answer = await db.Message.create({
                text,
                user,
                session: session_id
            })
            console.log(answer);
            let {_id, date} = answer;
            return {flag:"auth", user, _id, date};
        }
        return 'access...denied';

    }catch(err){
        return err;
    }
}
