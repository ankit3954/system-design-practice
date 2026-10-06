const { redisClient } = require("./redis-client")

const createBloomFilter = async(key, errorRate, capacity) => {
     try {
    await redisClient.bf.reserve(key, errorRate, capacity);
    console.log(`Filter ${key} created successfully.`);
  } catch (error) {
    // If it already exists, just log a warning and let the app continue
    if (error.message.includes('ERR item exists')) {
      console.log(`ℹ️ Bloom filter "${key}" already exists. Skipping initialization.`);
    } else {
      // Re-throw if it's a different runtime error
      throw error; 
    }
  }
}

const addInFilter = async(key, item) => {
    const res = await redisClient.bf.ADD(key, item);
    console.log(res);
}

const checkInFilter = async(key, item) => {
    const res = await redisClient.bf.exists(key, item);
        console.log(res);
    return res;

}

const addMultiItemInFilter = async(key, itemArray) => {
    const res = await redisClient.bf.mAdd(key, itemArray);
    console.log(res);
}

module.exports = {
    createBloomFilter,
    addInFilter,
    checkInFilter,
    addMultiItemInFilter
}