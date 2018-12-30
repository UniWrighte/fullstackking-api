require("dotenv").config();

const express = require("express");
const {idParse} = require("./logic/helpers");
const {socketMessageAuth, socketMeassageAuthAndSend} = require("./logic/message");
const db = require("./models");
const fileUpload = require('express-fileupload');
const cors = require("cors");
const bodyParser = require("body-parser");
const Routes = require("./routes")
const {errorBridge} = require("./bridges/errors");
const {Authenticate, Authorize, adminAuthenticate, adminAuthorize} = require("./middleware/verify");
const loggedinRoute = require("./routes/authenticate");
const adminRoute = require("./routes/admin");
const {collections} = require("./logic/admin");
const path = require("path");


const DEV_PORT = 8081;
const PORT = DEV_PORT;

const app = express();

const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static(`${__dirname}/../build`));
app.use(cors());
app.use(bodyParser.json());
app.use(fileUpload());

app.use(express.static("public/uploads"));
app.use("/logged/:id", Authenticate, Authorize, loggedinRoute);
//IMPORTANT TODO --- add auth.
app.use("/admin/:id", adminAuthenticate, adminAuthorize, adminRoute);

app.use("/", Routes);
app.use((req,res, next)=>{
    res.sendFile('index.html', {
        root: '../build',
        headers: {
            'Content-Type': 'text/html'
        }
    }, error =>{
        if( error ){
            return next(error);
        }
    })
});




io.on('connection', async function(socket){

    // console.log('user connected ');
    socket.emit('news', {hello: 'world'});
    socket.on('session', async (session)=>{


        try{

        let valid = await socketMessageAuth(session.session_id, session.token);
        if(valid === true){

            socket.join(session.session_id);

        }else{

            socket.disconnect(true);

        }



        }catch(err){
        // console.log("error is::: ", err);
        return;
        }

    });

    socket.on('send', async (d)=>{
        //use send message and receive message functionality and also broadcast after using socketMessageAuth

        try{
        let {text} = d.body;
        let {token, session} = d.head;
        let result = await socketMeassageAuthAndSend(session, token, text);
        let {flag, user, _id, date} = result;

        if(flag === 'auth'){
                // console.log("send broadcast to occur")                                    //grabbing username may be redundant.
        socket.broadcast.to(session).emit('socket_message_broadcast', {text,user,_id,date})
    }else{
        socket.emit("unauthorized", {message: "will place ip address here to send to admin panel"});
    }}catch(err){
        // console.log(err);
        return;
    }
    })
    socket.on('refresh_base_info', async (d)=>{
        try{
            let {token, session} = d.head;
            const result = await socketMessageAuth(session, token);
            result && socket.broadcast.to(session).emit('refresh_base_info', {alert: "this will be removed in future versions"});

        }catch(err){
            // console.log(err);
            return;
        }
    })






    socket.on('disconnect', ()=>{
        // console.log('user disconnect');
        return
    })

})
app.use(function(req,res,next){
    let err = new Error("Not Found");
    err.status = 404;
    return next(err);
})
app.use(errorBridge);

server.listen(PORT, ()=> console.log("listening on ", PORT));
