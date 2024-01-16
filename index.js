const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');
const { DateTime } = require('luxon');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const mongoUri = "mongodb+srv://elilarasi:elilarasi@cluster0.0ley2q5.mongodb.net/";
const dbName = 'resume_db';
const collectionName = 'form_submissions';

const client = new MongoClient(mongoUri);

async function initializeDatabase() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);

    // Check if the collection exists, create it if not
    const collections = await db.listCollections({ name: collectionName }).toArray();
    if (collections.length === 0) {
      await db.createCollection(collectionName);
      console.log(`Collection '${collectionName}' created`);
    } else {
      console.log(`Collection '${collectionName}' already exists`);
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();

app.post('/submit-form', async (req, res) => {
  try {
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const { name, email, subject, message } = req.body;

    // Get the current timestamp in Chennai timezone and format it
    const currentTimestamp = DateTime.now().setZone('Asia/Kolkata');
    const currentTimestampFormatted = currentTimestamp.toFormat("MMMM d, yyyy, h:mm a");

    const result = await collection.insertOne({
      name,
      email,
      subject,
      message,
      timestamp: currentTimestampFormatted,
      // Store the local timestamp without converting to UTC
      timestampLocal: currentTimestamp,
    });

    console.log(`Form data inserted with ID: ${result.insertedId}`);

    res.status(200).json({ message: 'Message shared successfully!' });
  } catch (error) {
    console.error('Error submitting the form:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
