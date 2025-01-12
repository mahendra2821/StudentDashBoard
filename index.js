const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require('cors') 
const studentRoutes = require('./routes/studentRoutes')
const resultRoutes = require('./routes/resultRoutes')



const app = express() 
dotenv.config() 
app.use(cors()) 

app.use(express.json());

mongoose.connect(process.env.MONGO_URI) 
  .then(() => console.log("MongoDB connected")) 
  .catch((error) => console.error("MongoDB connection error:", error));

app.use('/api/student' , studentRoutes);
app.use('/api/student/result' , resultRoutes)


const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



