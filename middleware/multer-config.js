const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

// config of the temp storage for multer
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'images/temp');
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split(' ').join('_');
    const extension = MIME_TYPES[file.mimetype];
    callback(null, name + Date.now() + '.' + extension);
  }
});

// create the temp folder if doesn't exist
const tempDir = path.join('images', 'temp');
if (!fs.existsSync('images')) {
  fs.mkdirSync('images');
}
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// image format
const fileFilter = (req, file, callback) => {
  if (Object.keys(MIME_TYPES).includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error('Format d\'image non supporté'), false);
  }
};


// Middleware to treat the image after the upload
const processImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }
  
  try {
    const inputPath = req.file.path;
    const outputFilename = `${req.file.filename.split('.')[0]}.webp`;
    const outputPath = path.join('images', outputFilename);

    await sharp(inputPath)
      .resize({ width: 500 })
      .toFormat('webp')
      .webp({ quality: 80 })
      .toFile(outputPath);
    
    // delete the temp file
    fs.unlinkSync(inputPath);
    
    // update the path in the object req.file
    req.file.filename = outputFilename;
    req.file.path = outputPath;
    req.file.destination = 'images';
    req.file.mimetype = 'image/webp';
    req.file.processedImageUrl = `${req.protocol}://${req.get('host')}/images/${outputFilename}`;
    
    next();
  } catch (error) {
    next(error);
  }
};

// Export a combined middleware
module.exports = (req, res, next) => {
  const upload = multer({ storage, fileFilter }).single('image');
  
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: `Erreur lors de l'upload: ${err.message}` });
    }
    
    if (!req.file) {
      return next();
    }
    
    processImage(req, res, next);
  });
};