require("dotenv").config();
const express = require("express");
const { MongoClient } = require("mongodb");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// MongoDB connection
const uri = process.env.MONGODB_URI;
let db;

async function connectDB() {
  if (db) return db;
  const client = new MongoClient(uri);
  await client.connect();
  db = client.db("hng_stage1");
  return db;
}

// Age group classifier
function classifyAgeGroup(age) {
  if (age <= 12) return "child";
  if (age <= 19) return "teenager";
  if (age <= 59) return "adult";
  return "senior";
}

// POST /api/profiles
app.post("/api/profiles", async (req, res) => {
  try {
    const { name } = req.body;

    if (name === undefined || name === "") {
      return res.status(400).json({ status: "error", message: "name is required" });
    }
    if (typeof name !== "string") {
      return res.status(422).json({ status: "error", message: "name must be a string" });
    }

    const db = await connectDB();
    const collection = db.collection("profiles");

    // Idempotency check
    const existing = await collection.findOne({ name: name.toLowerCase() });
    if (existing) {
      const { _id, ...data } = existing;
      return res.status(200).json({ status: "success", message: "Profile already exists", data });
    }

    const [genderRes, agifyRes, nationalizeRes] = await Promise.all([
      fetch(`https://api.genderize.io?name=${encodeURIComponent(name)}`),
      fetch(`https://api.agify.io?name=${encodeURIComponent(name)}`),
      fetch(`https://api.nationalize.io?name=${encodeURIComponent(name)}`),
    ]);

    const [genderData, agifyData, nationalizeData] = await Promise.all([
      genderRes.json(),
      agifyRes.json(),
      nationalizeRes.json(),
    ]);

    if (genderData.gender === null || genderData.count === 0) {
      return res.status(502).json({ status: "502", message: "Genderize returned an invalid response" });
    }
    if (agifyData.age === null) {
      return res.status(502).json({ status: "502", message: "Agify returned an invalid response" });
    }
    if (!nationalizeData.country || nationalizeData.country.length === 0) {
      return res.status(502).json({ status: "502", message: "Nationalize returned an invalid response" });
    }

    const topCountry = nationalizeData.country.reduce((a, b) =>
      a.probability > b.probability ? a : b
    );

    const profile = {
      id: uuidv4(),
      name: name.toLowerCase(),
      gender: genderData.gender,
      gender_probability: genderData.probability,
      sample_size: genderData.count,
      age: agifyData.age,
      age_group: classifyAgeGroup(agifyData.age),
      country_id: topCountry.country_id,
      country_probability: topCountry.probability,
      created_at: new Date().toISOString(),
    };

    await collection.insertOne({ ...profile });

    return res.status(201).json({ status: "success", data: profile });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

// GET /api/profiles
app.get("/api/profiles", async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection("profiles");

    const query = {};
    if (req.query.gender) query.gender = req.query.gender.toLowerCase();
    if (req.query.country_id) query.country_id = req.query.country_id.toUpperCase();
    if (req.query.age_group) query.age_group = req.query.age_group.toLowerCase();

    const profiles = await collection
      .find(query, {
        projection: { _id: 0, id: 1, name: 1, gender: 1, age: 1, age_group: 1, country_id: 1 },
      })
      .toArray();

    return res.status(200).json({ status: "success", count: profiles.length, data: profiles });
  } catch (err) {
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

// GET /api/profiles/:id
app.get("/api/profiles/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection("profiles");

    const profile = await collection.findOne(
      { id: req.params.id },
      { projection: { _id: 0 } }
    );

    if (!profile) {
      return res.status(404).json({ status: "error", message: "Profile not found" });
    }

    return res.status(200).json({ status: "success", data: profile });
  } catch (err) {
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

// DELETE /api/profiles/:id
app.delete("/api/profiles/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection("profiles");

    const result = await collection.deleteOne({ id: req.params.id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ status: "error", message: "Profile not found" });
    }

    return res.sendStatus(204);
  } catch (err) {
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;