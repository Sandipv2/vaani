import multer from "multer";

const storage = multer.memoryStorage();

const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
    "video/mp4",
    "video/webm",
    "video/quicktime"
];

const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only JPEG, PNG, WebP, GIF, HEIC, HEIF, MP4, WebM, MOV are allowed"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { 
        fileSize: 25 * 1024 * 1024,  // 25 MB
        files: 10,
    },
});

export default upload;
