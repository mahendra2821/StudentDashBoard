
const Result = require('../models/Result'); 



//////////////////////////////////////////////////////////////////////////////////////////////


const addOrUpdateResults = async (req, res) => {
  try {
    const { enrollmentNumber, studentName, semester, subjects } = req.body;

    if (!enrollmentNumber || !studentName || !semester || !subjects) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (semester < 1 || semester >= 8) {
      return res.status(400).json({ message: 'Semester must be between 1 and 8' });
    }

    if (subjects.length > 11) {
      return res.status(400).json({ message: 'A semester can have up to 11 subjects' });
    }

    const invalidSubjects = subjects.some(
      (subject) => !subject.subjectCode || !subject.name || !subject.grade || !subject.credits
    );

    if (invalidSubjects) {
      return res.status(400).json({
        message: 'Each subject must have a subjectCode, name, grade, and credits',
      });
    }

    const gradePoints = { 'A+': 10, A: 9, 'B+': 8, B: 7, C: 6, D: 5, F: 0, ABSENT: 0 }; // Add 'Absent' with 0 points
    let totalCredits = 0;
    let totalGradePoints = 0;

    const backlogs = subjects.filter((subject) => subject.grade === 'F' || subject.grade === 'ABSENT').length; // Count "Absent" as a backlog
    const status = backlogs > 0 ? 'Fail' : 'Pass';

    // Convert credits to integers
    subjects.forEach((subject) => {
      subject.credits = parseInt(subject.credits, 10); // Convert credits to integer
      totalCredits += subject.credits;
      totalGradePoints += (gradePoints[subject.grade] || 0) * subject.credits; // Default to 0 if grade not found
    });

    const sgpa = totalCredits === 0 ? 0 : parseFloat((totalGradePoints / totalCredits).toFixed(2));

    let result = await Result.findOne({ enrollmentNumber });

    if (!result) {
      result = new Result({ enrollmentNumber, studentName, semesters: [] });
    } else {
      result.studentName = studentName;
    }

    // Update or add the semester results
    const semesterIndex = result.semesters.findIndex((s) => s.semester === semester);

    if (semesterIndex >= 0) {
      // Update existing semester
      const previousBacklogs = result.semesters[semesterIndex].backlogs;
      result.semesters[semesterIndex] = { semester, subjects, sgpa, backlogs, status };
      result.totalBacklogs += backlogs - previousBacklogs; // Adjust totalBacklogs
    } else {
      // Add new semester
      result.semesters.push({ semester, subjects, sgpa, backlogs, status });
      result.totalBacklogs += backlogs;
    }

    // Do not recalculate CGPA for previous semesters
    const totalSGPA = result.semesters.reduce((sum, sem) => (sem.semester === semester ? sum + sgpa : sum + sem.sgpa), 0);
    const totalSemesters = result.semesters.length;

    const newCGPA = parseFloat((totalSGPA / totalSemesters).toFixed(2));
    result.semesters.forEach((sem) => {
      if (sem.semester === semester) {
        sem.cgpa = newCGPA;
      }
    });

    await result.save();

    res.status(200).json({ message: 'Results updated successfully', result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

  




//////////////////////////////////////////////////////////////////////   


const getResults = async (req, res) => {
    try {
        const {enrollmentNumber} = req.params;

        const result = await Result.findOne({enrollmentNumber});
        if (!result) {
            return res.status(404).json({message: 'Results not found'});
        }
        res.status(200).json({result});
    }
    catch(error) {
        res.status(500).json({error: error.message});
    }
}

/////////////////////////////////////////////////////////////// 


const getResultsSingle = async (req, res) => {
    try {
      const { enrollmentNumber } = req.body;
  
      if (!enrollmentNumber) {
        return res.status(400).json({ message: 'Enrollment number is required' });
      }
  
      const result = await Result.findOne({ enrollmentNumber });
  
      if (!result) {
        return res.status(404).json({ message: 'Results not found' });
      }
  
      res.status(200).json({ result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  /////////////////////////////////////////////////////////////////////////////////////////// 

  const updateBacklog = async (req, res) => {
    try {
      const { enrollmentNumber, semester } = req.params;
      const { subjectName, newGrade, newCredits } = req.body;
  
      if (!enrollmentNumber || !semester || !subjectName || (!newGrade && !newCredits)) {
        return res.status(400).json({ message: 'All fields are required' });
      }
  
      const result = await Result.findOne({ enrollmentNumber });
      if (!result) {
        return res.status(404).json({ message: 'Student results not found' });
      }
  
      const semesterIndex = result.semesters.findIndex((s) => s.semester == semester);
      if (semesterIndex < 0) {
        return res.status(404).json({ message: `Semester ${semester} not found` });
      }
  
      const semesterData = result.semesters[semesterIndex];
  
      const subjectIndex = semesterData.subjects.findIndex((sub) => sub.name === subjectName);
      if (subjectIndex < 0) {
        return res.status(404).json({ message: `Subject ${subjectName} not found` });
      }
  
      const subjectData = semesterData.subjects[subjectIndex];
  
      // Update grade and credits
      if (newGrade) {
        subjectData.grade = newGrade;
      }
      if (newCredits) {
        subjectData.credits = parseInt(newCredits, 10); // Convert newCredits to integer
      }
  
      // Ensure all subject credits are integers
      semesterData.subjects.forEach((sub) => {
        sub.credits = parseInt(sub.credits, 10);
      });
  
      // Recalculate SGPA for the semester
      const gradePoints = { 'A+': 10, A: 9, 'B+': 8, B: 7, C: 6, D: 5, F: 0 };
      const totalGradePoints = semesterData.subjects.reduce(
        (sum, subject) => sum + gradePoints[subject.grade] * subject.credits,
        0
      );
      const totalCredits = semesterData.subjects.reduce((sum, subject) => sum + subject.credits, 0);
  
      semesterData.sgpa = parseFloat((totalGradePoints / totalCredits).toFixed(2));
  
      // Recalculate backlogs for the semester
      semesterData.backlogs = semesterData.subjects.filter((sub) => sub.grade === 'F').length;
      semesterData.status = semesterData.backlogs > 0 ? 'Fail' : 'Pass';
  
      result.totalBacklogs = result.semesters.reduce((sum, sem) => sum + sem.backlogs, 0);
  
      // Recalculate CGPA
      const totalSGPA = result.semesters.reduce((sum, sem) => sum + sem.sgpa * sem.subjects.length, 0);
      const totalSubjectCredits = result.semesters.reduce((sum, sem) => sum + sem.subjects.length, 0);
      const newCGPA = parseFloat((totalSGPA / totalSubjectCredits).toFixed(2));
  
      result.semesters.forEach((sem) => {
        sem.cgpa = newCGPA;
      });
  
      await result.save();
  
      res.status(200).json({
        message: 'Backlog, grades, and credits updated successfully',
        result,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
    ///////////////////////////////////////////////////////////////////////////////////////////////////

  const deleteSemester = async (req, res) => {
    try {
      const { enrollmentNumber, semester } = req.body;
  
      if (!enrollmentNumber || !semester) {
        return res.status(400).json({ message: 'Enrollment number and semester are required' });
      }
  
      const result = await Result.findOne({ enrollmentNumber });
  
      if (!result) {
        return res.status(404).json({ message: 'Student not found' });
      }
  
      const semesterIndex = result.semesters.findIndex((s) => s.semester === semester);
  
      if (semesterIndex === -1) {
        return res.status(404).json({ message: 'Semester not found' });
      }
  
      result.semesters.splice(semesterIndex, 1);
  
      result.totalBacklogs = result.semesters.reduce(
        (sum, sem) => sum + (sem.backlogs || 0),
        0
      );
  
      // Recalculate CGPA for remaining semesters
      if (result.semesters.length > 0) {
        const totalSGPA = result.semesters.reduce((sum, sem) => sum + sem.sgpa, 0);
        const newCGPA = parseFloat((totalSGPA / result.semesters.length).toFixed(2));
  
        result.semesters.forEach((sem) => {
          sem.cgpa = newCGPA;
        });
      }
  
      await result.save();
  
      res.status(200).json({ message: 'Semester deleted successfully', result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  


//////////////////////////////////////////////////////////////////////////////////////////////

const deleteStudentData = async (req, res) => {
    try {
      const { enrollmentNumber } = req.body;
  
      if (!enrollmentNumber) {
        return res.status(400).json({ message: 'Enrollment number is required' });
      }
  
      // Delete results associated with the student
      const resultsDeleted = await Result.deleteMany({ enrollmentNumber });
  
      if (resultsDeleted.deletedCount === 0) {
        return res.status(404).json({ message: 'No data found for the given enrollment number' });
      }
  
      res.status(200).json({
        message: `Student data for enrollment number ${enrollmentNumber} and associated records deleted successfully.`,
        
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };


  ///////////////////////////////////////////////////////////////////////////////////////////
  //End

  
   module.exports = { addOrUpdateResults, getResults, getResultsSingle, updateBacklog, deleteSemester , deleteStudentData};
