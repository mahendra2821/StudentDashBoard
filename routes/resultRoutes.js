const express= require('express');
const {addOrUpdateResults, getResults, getResultsSingle,updateBacklog,deleteSemester, deleteStudentData } = require('../controllers/resultController')

const router  = express.Router();

router.post('/' , addOrUpdateResults); 
router.get('/:enrollmentNumber' , getResults); 
router.get('/' , getResultsSingle); 
router.put('/:enrollmentNumber/:semester/backlog' , updateBacklog); 
router.delete('/delete/semester' , deleteSemester); 
router.delete('/delete/student' , deleteStudentData); 


module.exports = router; 

