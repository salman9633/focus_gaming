const cloudinary=require('cloudinary').v2;

cloudinary.config({
    // cloud_name: process.env.CLOUDINARY_CLOOUD_NAME,
    // api_key: process.env.CLOUDINARY_API_KEY,
    // api_secret: process.env.CLOUDINARY_API_SECRETKEY

    cloud_name: 'delmsjmlq',
    api_key: '941254659513852',
    api_secret: 'MEGEZNQz9qgf2IzjuPr1ftq-zZw'
})

module.exports = cloudinary