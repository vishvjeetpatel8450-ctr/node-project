const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        const userId = req.params.id || "user";
        const filename = userId + "-" + Date.now() + path.extname(file.originalname);
        cb(null, filename);
    },
});

const filefilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed"), false);
    }
};
    
const upload = multer({
    storage: storage,
    fileFilter: filefilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;