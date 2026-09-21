const { streamUpload } = require("../utils/cloudinary-storage");

const uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No image file was provided." });
  }

  try {
    const result = await streamUpload(req.file.buffer);
    return res.status(201).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(502).json({ success: false, message: "Image upload failed." });
  }
};

module.exports = { uploadImage };
