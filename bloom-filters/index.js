const express = require("express");
const { connectRedisClient} = require("./redis-client");
const { createBloomFilter, checkInFilter, addInFilter, addMultiItemInFilter } = require("./bloom-filter");

const app = express();


const startServer = async () => {
    try {
        await connectRedisClient();

        await createBloomFilter("bike", 0.001, 100000); 

        await addInFilter("bike", "honda sp125");
        await addInFilter("bike", "honda shine");
        await addInFilter("bike", "ns200");
        await addMultiItemInFilter("bike", ["pulsar", "glamour"]);

        const exists = await checkInFilter("bike", "pulsar");
        console.log(`Does pulsar exist? ${exists}`);

        app.listen(3000, () => {
            console.log("Server is running on port 3000");
        });

    } catch (error) {
        console.error("Critical error starting server:", error);
    }
};

startServer();