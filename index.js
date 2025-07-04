import dotenv from "dotenv"


import { app } from "./src/app.js"
import connectDB from "./src/db/index.js"

dotenv.config({
    path: "./env"
})

connectDB()
.then(()=>{
       app.on("error",(error)=>{
           console.log("he server connection error : ",error)
           throw error
       })

      const port =process.env.PORT || 3000;
      app.listen(port,'0.0.0.0',()=>{
           console.log(`Server running at http://0.0.0.0:${port}`)
       })
})
.catch((error)=>{
    console.log("MONGO db connection failed !!! ",error);
})