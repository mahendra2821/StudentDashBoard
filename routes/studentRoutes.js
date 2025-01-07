const express = require('express');
const {register, login} = require('../controllers/studentController');

const router = express.Router();
router.post('/dashboard', register);
router.post('/login', login);

module.exports = router