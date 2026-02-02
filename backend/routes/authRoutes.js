const express = require('express');
const router = express.Router();
const { adminLogin, registerStudent, registerFaculty, studentLogin, facultyLogin } = require('../controllers/authController');

router.post('/admin/login', adminLogin);
router.post('/students/register', registerStudent);
router.post('/students/login', studentLogin);
router.post('/faculty/register', registerFaculty);
router.post('/faculty/login', facultyLogin);

module.exports = router;
