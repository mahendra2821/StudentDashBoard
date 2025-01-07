// models/Result.js
const mongoose = require('mongoose');

// Subject schema
const subjectSchema = new mongoose.Schema({
 
  subjectCode : {type: String, required:true},
  name: { type: String, required: true },
  internal : {type: Number, required: true},
  credits: { type: Number, required: true },
  grade: { type: String, required: true },
});

// Semester schema
const semesterSchema = new mongoose.Schema({
  semester: { type: Number, required: true },
  subjects: { type: [subjectSchema], required: true },
  sgpa: { type: Number, required: true },
  cgpa: { type: Number, default: 0 }, // Will be auto-calculated
  backlogs: { type: Number, default: 0 }, // Will count subjects with failing grades
  status: { type: String, enum: ['Pass', 'Fail'], default: 'Pass' }, // Auto-determined based on backlogs
});

// Result schema
const resultSchema = new mongoose.Schema({
  enrollmentNumber: { type: String, unique: true, required: true },
  studentName: {type: String, required: true},
//   dateOfBirth : {type: Date, required:true},
  semesters: { type: [semesterSchema], default: [] }, 
  totalBacklogs : {type: Number,  default : 0},
});

module.exports = mongoose.model('Result', resultSchema);
