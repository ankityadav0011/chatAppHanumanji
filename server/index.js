const express = require('express')
const cors = require('cors')
require('dotenv').config()
const connectDB = require("./config/connectDB")
const router = require("./routes/index")
const cookiesParser = require("cookie-parser")

const {app,server} = require("./socket/index")
const path = require("path")




app.use(cors({
    origin:"http://localhost:3000",
    credentials:true,
}))

const PORT = process.env.PORT || 5050;   

// app.get('/',(req,res)=>{
//     res.json({
//         message:`server is running on port ${PORT}`
//     })
// })

app.use(express.json())
app.use(cookiesParser())
// APi Endpoints 
app.use("/api",router);

connectDB().then(()=>{
    console.log("Db Connected");
})


// ------------Deployment ------------------

const __dirname1 = path.resolve();
if(process.env.NODE_ENV === "production"){
    // we r establing the path bet. current runnning directory to build folder of frontend  
  app.use(express.static(path.join(__dirname1,"/client/build")))

  app.get("*",(req,res)=>{
    res.sendFile(path.resolve(__dirname1, "client", "build", "index.html"));
  });
}else{
    app.get('/',(req,res)=>{
        res.json({
            message:`server is running on port ${PORT}`
        })
    })
}


server.listen(PORT,()=>{
    console.log("SERVer is runnning" + `localhost:${PORT}`)
})


