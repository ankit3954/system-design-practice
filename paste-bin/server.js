const express = require("express");
const multer = require("multer");
const { r2 } = require("./r2-config.js");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const path = require("path")
require("dotenv").config()

const app = express();
const upload = multer({ storage: multer.memoryStorage() });


app.get("/", (req, res) => {
    res.send("Hi")
})


app.get("/file", (req, res) => {
    try {
        res.send("Hello");
    } catch (error) {

    }
});


app.post("/file-upload", upload.single('file'), async (req, res) => {
    try {
        // res.send("Hello");
        const file = req.file;

        if (!file) return res.status(400).json({ error: 'No file provided' });

        const fileUUID = crypto.randomUUID();
        const userId = 1234;
        const ext = path.extname(file.originalname); // Optional: preserves .png, .txt, etc.

        // Resulting path: paste-bin/1/a1b2c3d4-....ext
        const key = `${userId}/${fileUUID}${ext}`;

        await r2.send(
            new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
            })
        );

        res.json({
            message: 'Upload successful',
            fileUUID,
            key
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Upload failed' });
    }
})

app.listen(3000, () => {
    console.log("Server is running on 3000");
});


