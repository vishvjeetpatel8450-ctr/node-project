require('dotenv').config();

const dns = require("dns");   
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const app = express(); 

const userroutes = require("./src/routes/userroutes");
const connectDB = require("./src/config/db");
 
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/users", userroutes);     

connectDB();
  
const PORT = process.env.PORT || 3001;
  
app.listen(PORT,() => {
    console.log(`server is running on http://localhost:${PORT}`); 
});   
     