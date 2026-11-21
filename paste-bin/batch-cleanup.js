const { pool } = require("./mysql-config.js");
const { r2 } = require("./r2-config.js");
const { DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const path = require("path");

const BATCH_SIZE = 100;
const PAUSE_MS = 300;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getExpiredFilesBatch = async () => {
    try {
        const [rows] = await pool.execute("SELECT * FROM file_metadata WHERE expiration_date < NOW() LIMIT ?", [10]);
        return rows;
    } catch (error) {
        console.error("Not able to get expired files");
    }
}

const runExpiredFileCleanup = async() => {
    let processedInBatch = 0;
    let totalDeleted = 0;
    let deletedIds = [];
    do {
        const expiredFiles = await getExpiredFilesBatch(BATCH_SIZE);
        processedInBatch = expiredFiles.length;

        if (processedInBatch === 0) break;

        deletedIds = await deleteBatchFromR2(expiredFiles);

        if (deletedIds.length > 0) {
            await deleteDbRecordsByIds(deletedIds);
            totalDeleted += deletedIds.length;
            console.log(`[Cleanup] Removed ${deletedIds.length} expired files (Total: ${totalDeleted})`);
        }

        await sleep(PAUSE_MS);
    } while (processedInBatch === BATCH_SIZE && deletedIds.length > 0);

    return totalDeleted;
}



const deleteBatchFromR2 = async (key) => {
    const keyToIdMap = new Map();
    const objects = files.map((file) => {
        const ext = path.extname(file.file_name);
        const key = `${file.owner_id}/${file.id}${ext}`;
        keyToIdMap.set(key, file.id);
        return { Key: key };
    });

    const response = await r2.send(
        new DeleteObjectsCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Delete: {
                Objects: objects,
                Quiet: false, // Returns both Deleted and Errors arrays
            },
        })
    );

    // Log any individual keys that R2 failed to delete
    if (response.Errors && response.Errors.length > 0) {
        for (const err of response.Errors) {
            console.error(`[Cleanup] R2 failed to delete ${err.Key}: ${err.Message}`);
        }
    }

    const deletedIds = (response.Deleted || [])
        .map((item) => keyToIdMap.get(item.Key))
        .filter(Boolean);

    return deletedIds;
}

const deleteDbRecordsByIds = async (deletedIds) => {
    if (!deletedIds || deletedIds.length === 0) return;

    await pool.query(
        `DELETE FROM file_metadata WHERE id IN (?)`,
        [deletedIds]
    );
}


module.exports = {
    runExpiredFileCleanup
}