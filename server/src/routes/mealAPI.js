const express = require('express');
const router = express.Router();
const moment = require('moment-timezone')
module.exports = (db) => {
    // GET endpoint to retrieve users
    router.get('/orders', (req, res) => {
        db.all('SELECT * FROM orders', [], (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            const orders = rows.map(row => ({
                id: row.id,
                language: row.language,
                meals: JSON.parse(row.meals),
                roomNumber: row.roomNumber,
                signS3url: row.signS3url,
                created_at: moment.utc(row.created_at).tz("America/New_York").format('MMMM Do YYYY, h:mm:ss a')
            }));
            res.json(orders);
        });
    });

    // POST endpoint to create a new user
    router.post('/submit-order', (req, res) => {
        const { language, meals, roomNumber, signS3url, created_at } = req.body.data;
        console.log(language, meals, roomNumber, signS3url)
        if (!language || !meals || !roomNumber || !signS3url) {
            res.status(400).json({ error: 'All fields (language, meals, roomNumber, signS3url) are required' });
            return;
        }
        const mealsString = JSON.stringify(meals);
        db.run('INSERT INTO orders (language, meals, roomNumber, signS3url) VALUES (?, ?, ?, ?)', [language, mealsString, roomNumber, signS3url], function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(200).json({ message: 'Order created!', order: { id: this.lastID, language, meals, roomNumber, created_at } });
        });
    });

    // DELETE endpoint to delete all orders
    router.delete('/delete-orders', (req, res) => {
        db.run('DELETE FROM orders', [], function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(200).json({ message: 'All orders deleted' });
        });
    });


    return router;
};