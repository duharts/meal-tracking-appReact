const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const router = require('./routes/index.js');
const errorHandler = require('./middleware/errorHandler.js')
const logger = require('./utils/logger.js')
const mealAPI = require('./routes/mealAPI.js')
const sqlite3 = require('sqlite3')
const AWS = require('aws-sdk')
const cron = require('node-cron');

dotenv.config()

// Configure the SDK with your AWS region
AWS.config.update({
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRETACCESSKEY,
    region: 'us-east-1'
});

// Create a DynamoDB DocumentClient instance
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// const syncToDynamoDB = () => {
//     db.all('SELECT * FROM Orders', [], (err, rows) => {
//         if (err) {
//             console.error('Error fetching data from SQLite:', err.message);
//             return;
//         }
//         rows.forEach((order) => {
//             const params = {
//                 TableName: 'mealtracker', // DynamoDB table name
//                 Item: {
//                     id: order.id,
//                     name: order.name,
//                     language: order.language,
//                     meals: order.meals,
//                     roomNumber: order.roomNumber,
//                     signS3url: order.signS3url,
//                     created_at: order.created_at
//                 },
//             };
//             dynamoDB.put(params, (err) => {
//                 if (err) {
//                     console.error('Error adding data to DynamoDB:', err.message);
//                 } else {
//                     console.log(`Order ${order.id} synchronized to DynamoDB.`);
//                 }
//             });
//         });
//     });
// };

const db = new sqlite3.Database('./local.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the local SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            language TEXT NOT NULL,
            meals TEXT NOT NULL,
            roomNumber TEXT NOT NULL,
            signS3url TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// Schedule synchronization every hour
// setInterval(syncToDynamoDB, 60 * 1000);


const app = express()

//security middleware
// app.use(helmet())
app.use(cors({
    origin: process.env.frontend_url || 'http://localhost:3000'
}))

//Body parsing middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//routes
app.use('/api', mealAPI(db))
app.get('/', (req, res) => {
    res.send('Welcome to the Meal Tracking Application server!');
});

function getDataFromSQLite(query) {
    return new Promise((resolve, reject) => {
        db.all(query, [], (err, rows) => {
            if (err) reject(err);
            resolve(rows);
        });
    });
}

async function updateDynamoDB(tableName, data) {
    const params = {
        TableName: tableName,
        Item: data,
    };

    try {
        await dynamoDB.put(params).promise();
        console.log('Data inserted/updated in DynamoDB');
    } catch (error) {
        console.error('Error updating DynamoDB:', error);
        throw new Error('DynamoDB update failed');
    }
}

async function syncSQLiteToDynamoDB() {
    const sqliteData = await getDataFromSQLite('SELECT * FROM Orders');

    for (const record of sqliteData) {
        await updateDynamoDB('mealtracker', record);
    }
}

//cron job
// Sync every day at midnight
cron.schedule('*/40 * * * *', () => {
    syncSQLiteToDynamoDB().then(() => {
        console.log('Data sync completed');
    }).catch((error) => {
        console.error('Data sync failed:', error);
    });
});

//error handling
app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`)
})