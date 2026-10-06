const express = require("express");
const {read, write} = require("./dbConfig");

const app = express();

app.get("/", async(req, res) => {
    const items = await read("SELECT * from product_listing;");
    res.send(items);
});

app.post("/add-item", async(req, res) => {
    await write("Insert into product_listing (name, category, price, weight, available_quantity) VALUES(?, ?, ?, ?, ?)", ['Clip-On Reading Book Light', 'Electronics', 14, 80, 145]);
    res.send("Added")
});

app.patch("/", (req, res) => {

});

app.delete("/delete-item", async(req, res) => {
    const id = 101;
    await write("delete from product_listing where id = ?", [id]);
     res.send("Deleted")
});


app.listen(3000, () => {
    console.log("Server is running on port 3000.")
})