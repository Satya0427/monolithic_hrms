import multer from "multer";

export const upload = multer({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter(req, file, cb) {
        if (!file.mimetype.startsWith("image/")) {
            cb(new Error("Only image files allowed"));
        }
        cb(null, true);
    }
});
