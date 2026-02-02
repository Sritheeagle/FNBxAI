const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = 'uploads/common/';

        // Determine path based on fields (if available in req.body - limited support in diskStorage 'destination' as body might not be fully parsed yet depending on multer version/config, but usually works for text fields coming before files)
        // A safer bet is to categorize by simple type or just dump in 'materials' and let controller move it, or just use date-based folders.
        // For this requirement: "years wise... semster wise notes"

        // We will organize by "materials" root for now.
        uploadPath = 'uploads/materials/';

        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Create unique filename: fieldname-timestamp.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter (optional)
const fileFilter = (req, file, cb) => {
    // Accept all files for now as per requirement (video, notes, model papers)
    cb(null, true);
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

module.exports = upload;
