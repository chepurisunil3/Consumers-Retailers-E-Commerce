const express = require("express");
const auth = require("../middlewares/auth");
const { upload } = require("../utils/cloudinary-storage");
const { uploadImage } = require("../controllers/uploads");

const router = express.Router();

router.post("/image", auth, upload.single("image"), uploadImage);

module.exports = router;
