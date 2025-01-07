const StudentInfo = require('../models/StudentInfo');
const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const {enrollmentNumber, password, name , course} = req.body;

        const existingUser = await StudentInfo.findOne({enrollmentNumber});

        if (existingUser) {
            return res.status(400).json({message: 'Student already registered'});

        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newStudent = new StudentInfo({
            enrollmentNumber,
            password: hashedPassword,
            name,
            course,
        });
        await newStudent.save();

        res.status(201).json({message: "student registered successfully"});

    }
    catch(error) {
        res.status(500).json({error: error.message}); 

    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////

const login = async (req, res) => {
    try {
        const {enrollmentNumber , password} = req.body; 

        const student = await StudentInfo.findOne({enrollmentNumber});

        if (!student) {
            return res.status(404).json({message: 'Student not found'}) 

        }
        const isMatch = await bcrypt.compare(password , student.password);

        if (!isMatch) {
            return res.status(400).json({message: 'Invalid  credentials'});

        }

        const token = jwt.sign(
            {id: student._id, enrollmentNumber: student.enrollmentNumber},
            process.env.JWT_SECRET,
            {expiresIn: '1h'}
        )
        res.json({message: 'Login Successfull' , token}) ;
    }
    catch(error) {
        res.status(500).json({error: error.message});
    }
}

module.exports = {register , login}