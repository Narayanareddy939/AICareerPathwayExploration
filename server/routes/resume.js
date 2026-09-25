const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Configure multer storage
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `resume-${req.user._id}-${uniqueSuffix}${ext}`);
  }
});

async function extractTextFromFile(filePath, ext) {
  try {
    if (ext === '.txt') {
      return fs.readFileSync(filePath, 'utf8');
    }
    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfModule = require('pdf-parse');
      if (typeof pdfModule === 'function') {
        const parsed = await pdfModule(dataBuffer);
        if (parsed?.text) return parsed.text;
      }
      if (pdfModule.PDFParse) {
        const parser = new pdfModule.PDFParse({ data: dataBuffer });
        await parser.load();
        const res = await parser.getText();
        if (typeof res === 'string' && res.trim()) return res;
        if (res?.text) return res.text;
      }
    }
  } catch (err) {
    console.warn('PDF/File text extraction warning:', err.message);
  }
  return '';
}

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain'
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(file.mimetype) || ['.pdf', '.txt', '.doc', '.docx'].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOCX, and TXT files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// POST /api/resume/upload
router.post('/upload', protect, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    let extractedText = '';
    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    extractedText = await extractTextFromFile(filePath, ext);

    // Update student profile with resume path
    const student = await Student.findOneAndUpdate(
      { userId: req.user._id },
      {
        resumePath: req.file.filename,
        resumeOriginalName: req.file.originalname,
        resumeUploadedAt: new Date()
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Resume uploaded successfully',
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      extractedText
    });
  } catch (err) {
    console.error('Resume upload error:', err);
    res.status(500).json({ success: false, message: err.message || 'Upload failed' });
  }
});

// GET /api/resume/my-resume (Fetches saved resume text from file or profile)
router.get('/my-resume', protect, async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    let extractedText = '';
    if (student.resumePath) {
      const filePath = path.join(uploadDir, student.resumePath);
      if (fs.existsSync(filePath)) {
        const ext = path.extname(student.resumePath).toLowerCase();
        extractedText = await extractTextFromFile(filePath, ext);
      }
    }

    res.json({
      success: true,
      hasUploadedResume: !!student.resumePath,
      resumeOriginalName: student.resumeOriginalName,
      extractedText,
      studentProfile: student
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Error handler for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
});

module.exports = router;
