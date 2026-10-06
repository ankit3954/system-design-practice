const { Kafka } = require("kafkajs")

const kafka = new Kafka({
    clientId: "food-delivery-app",
    brokers: ["192.168.1.70: 9092"]
});

module.exports = kafka;