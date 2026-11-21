require("dotenv").config()

const express = require("express");
const multer = require("multer");
const { connectDB, pool } = require("./mysql-config.js");
const { r2 } = require("./r2-config.js");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const path = require("path");

connectDB();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });


app.get("/", (req, res) => {
    res.send("Hi")
})


app.get("/file/:fileUUID", (req, res) => {
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
        const ext = path.extname(file.originalname);

        const key = `${userId}/${fileUUID}${ext}`;


         await r2.send(
            new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
            })
        );
        
        const [result] = await pool.execute("INSERT INTO file_metadata(id, file_name, visibility, owner_id, expiration_date) VALUES(?, ?, ?, ?, ?)", [
            fileUUID,
            file.originalname,
            'PUBLIC',
            userId,
            '2026-11-22'
        ]);

       

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


