const Exam = require('../models/Exam');
const Result = require('../models/Result');
const Student = require('../models/Student');
const sse = require('../sse');

exports.getExams = async (req, res) => {
    try {
        const { year, section, branch, facultyId } = req.query;
        let query = {};
        if (year) query.year = year;
        if (section) query.section = section;
        if (branch) query.branch = branch;
        if (facultyId) query.facultyId = facultyId;

        const exams = await Exam.find(query).sort({ createdAt: -1 });
        res.json(exams);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getFacultyExams = async (req, res) => {
    try {
        const { facultyId } = req.params;
        const exams = await Exam.find({ facultyId }).sort({ createdAt: -1 });
        res.json(exams);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createExam = async (req, res) => {
    try {
        const exam = new Exam(req.body);
        await exam.save();

        // Broadcast Update
        sse.broadcast('exams', { action: 'create', data: exam });

        res.status(201).json(exam);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateExam = async (req, res) => {
    try {
        const { id } = req.params;
        const exam = await Exam.findByIdAndUpdate(id, req.body, { new: true });
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        // Broadcast Update
        sse.broadcast('exams', { action: 'update', data: exam });

        res.json(exam);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteExam = async (req, res) => {
    try {
        const { id } = req.params;
        const exam = await Exam.findByIdAndDelete(id);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        // Broadcast Update
        sse.broadcast('exams', { action: 'delete', id });

        res.json({ message: 'Exam deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getStudentExams = async (req, res) => {
    try {
        const { year, section, branch } = req.query;
        const query = {
            year: year,
            branch: branch,
            status: 'published'
        };
        if (section) {
            query.$or = [{ section: section }, { section: "" }, { section: { $exists: false } }];
        }

        const exams = await Exam.find(query).sort({ createdAt: -1 });
        res.json(exams);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.submitExam = async (req, res) => {
    try {
        const { studentId, examId, answers } = req.body;
        const exam = await Exam.findById(examId);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        const student = await Student.findOne({ sid: studentId });
        if (!student) return res.status(404).json({ error: 'Student not found' });

        let score = 0;
        let totalMarks = 0;

        exam.questions.forEach((q, i) => {
            const marks = q.marks || 1;
            totalMarks += marks;
            if (answers[i] !== null && answers[i] !== undefined) {
                const selectedOptionText = exam.questions[i].options[answers[i]];
                if (selectedOptionText === q.correctAnswer) {
                    score += marks;
                }
            }
        });

        const result = new Result({
            studentId: student._id,
            sid: studentId,
            examId: examId,
            score,
            totalMarks,
            answers
        });

        await result.save();

        // Broadcast for analytics
        sse.broadcast('exams', { action: 'submit', data: result });

        res.json({
            score,
            totalMarks,
            percentage: Math.round((score / totalMarks) * 100),
            submittedAt: result.submittedAt
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getStudentResults = async (req, res) => {
    try {
        const { sid } = req.params;
        const results = await Result.find({ sid }).populate('examId').sort({ submittedAt: -1 });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getExamAnalytics = async (req, res) => {
    try {
        const results = await Result.find()
            .populate('studentId', 'name sid branch year section')
            .populate('examId', 'title subject')
            .sort({ submittedAt: -1 });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
