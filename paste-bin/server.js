require("dotenv").config()

const express = require("express");
const multer = require("multer");
const { connectDB, pool } = require("./mysql-config.js");
const { r2 } = require("./r2-config.js");
const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const path = require("path");
const { initCleanupCron } = require("./file-cleanup-job.js")

connectDB();
initCleanupCron();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });


app.get("/", (req, res) => {
    res.send("Hi")
})


app.get("/file/:fileUUID", async (req, res) => {
    try {
        const { fileUUID } = req.params;

        const [rows] = await pool.execute("SELECT * FROM file_metadata WHERE id = ?", [fileUUID]);

        if (rows.length == 0) {
            return res.status(404).json({ error: "No file Found" });
        }

        const metadata = rows[0];

        const todayDate = new Date();
        if (new Date(metadata.expiration_date) < todayDate) {
            return res.status(410).json({ error: "File has expired" });
        };

        const userId = metadata.owner_id;
        const fileName = metadata.file_name;
        const ext = path.extname(fileName);
        const key = `${userId}/${fileUUID}${ext}`;

        const file = await r2.send(
            new GetObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key
            })
        );

        res.setHeader("Content-Type", file.ContentType || "application/octet-stream");
        if (file.ContentLength) {
            res.setHeader("Content-Length", file.ContentLength);
        }

        res.on("close", () => {
            if (!res.writableEnded && file.Body.destroy) {
                file.Body.destroy();
            }
        });

        file.Body.pipe(res);

    } catch (error) {
        console.error("Error fetching file:", error);

        if (error.name === "NoSuchKey") {
            return res.status(404).json({ error: "File missing from storage" });
        }

        if (!res.headersSent) {
            return res.status(500).json({ error: "Failed to retrieve file" });
        }
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


