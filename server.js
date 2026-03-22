const express = require("express");
const { MongoClient } = require("mongodb");

const cors = require("cors");
const app = express();
app.use(cors());
app.options("/ { *splat }", cors());

app.use(express.json());

// Replace with your connection string

const uri = "mongodb://pradeepyamuna123_db_user:iXafMgypHm2RVntI@ac-hmshs7q-shard-00-00.wmbm6c5.mongodb.net:27017,ac-hmshs7q-shard-00-01.wmbm6c5.mongodb.net:27017,ac-hmshs7q-shard-00-02.wmbm6c5.mongodb.net:27017/?ssl=true&replicaSet=atlas-12fc7f-shard-0&authSource=admin&appName=Cluster0";

const client = new MongoClient(uri);

let db;

// Connect to MongoDB
async function connectDB() {
try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    db = client.db("Pradeep");

    app.listen(3000, () => {
      console.log("🚀 Server running on port 3000");
    });

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
  }
}

connectDB();

app.post("/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password required"
      });
    }

    // Direct string match
    const user = await db.collection("admin-users").findOne({
      username: username,
      password: password
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    // Optional admin check
    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not an admin"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: user
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


app.post("/user-response", async (req, res) => {
  try {

    // Fetch latest record
    const data = await db.collection("user-response").find({}).toArray();

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "No data found"
      });
    }

    return res.status(200).json({
      success: true,
      data: data
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


app.post("/user-response/insert", async (req, res) => {
  try {
    const { response } = req.body;

    if (!response) {
      return res.status(400).json({
        success: false,
        message: "Response is required"
      });
    }

    const result = await db.collection("user-response").insertOne({
      response: response,
      date: new Date()
    });

    return res.status(200).json({
      success: true,
      message: "Data inserted successfully",
      insertedId: result.insertedId
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


app.post("/user-response/clear", async (req, res) => {
  try {
    const result = await db.collection("user-response").deleteMany({});

    return res.status(200).json({
      success: true,
      message: "All records deleted successfully",
      deletedCount: result.deletedCount
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


app.post("/validate-secret", async (req, res) => {
  try {
    const { secret_key } = req.body;

    if (!secret_key) {
      return res.status(400).json({
        success: false,
        message: "secret_key required"
      });
    }

    // Check only secret_key
    const data = await db.collection("users-data").findOne({
      secret_key: secret_key
    });

    if (!data) {
      return res.status(401).json({
        success: false,
        message: "secret mismatch"
      });
    }

    return res.status(200).json({
      success: true,
      result: true
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});




// ─── COUNTDOWN: Save target date ──────────────────────────
// Saves IST datetime string to settings collection
app.post("/countdown/set", async (req, res) => {
  try {
    const { targetISO } = req.body;
    if (!targetISO) {
      return res.status(400).json({ success: false, message: "targetISO is required" });
    }
    await db.collection("settings").updateOne(
      { key: "countdownTarget" },
      { $set: { key: "countdownTarget", value: targetISO, updatedAt: new Date() } },
      { upsert: true }
    );
    return res.status(200).json({ success: true, message: "Countdown target saved", targetISO });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── COUNTDOWN: Get current target date ──────────────────
app.post("/countdown/get", async (req, res) => {
  try {
    const doc = await db.collection("settings").findOne({ key: "countdownTarget" });
    if (!doc) {
      return res.status(200).json({ success: true, targetISO: null });
    }
    return res.status(200).json({ success: true, targetISO: doc.value });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Start server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});