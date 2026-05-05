require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  }
}));
app.use(express.json());

// =====================
// MongoDB Connection
// =====================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log("MongoDB Error:", err));

// =====================
// Schemas
// =====================

// Student Schema
const studentSchema = new mongoose.Schema({
  name: String,
  email: String,
  walletAddress: String,
  faceDescriptor: Array
});

studentSchema.index({ walletAddress: 1 }, { unique: true, sparse: true });

const Student = mongoose.model("Student", studentSchema);

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
  studentId: String,
  sessionId: Number,
  timestamp: Date
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

// =====================
// Routes
// =====================

// Health Check
app.get("/", (req, res) => {
  res.send("FaceChain Backend Running 🚀");
});

// Register Student
app.post("/register", async (req, res) => {
  try {
    const walletAddress = String(req.body.walletAddress || "").toLowerCase();

    if (!req.body.name || !req.body.email || !walletAddress) {
      return res.status(400).json({ message: "name, email, and walletAddress are required" });
    }

    const student = await Student.findOneAndUpdate(
      { walletAddress },
      {
        name: req.body.name,
        email: req.body.email,
        walletAddress,
        faceDescriptor: req.body.faceDescriptor || []
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ message: "Student Registered", student });
  } catch (err) {
    res.status(500).json(err);
  }
});

// Find students by wallet address for the teacher attendance list
app.get("/students/by-wallets", async (req, res) => {
  try {
    const wallets = String(req.query.addresses || "")
      .split(",")
      .map(address => address.trim().toLowerCase())
      .filter(Boolean);

    const students = await Student.find(
      { walletAddress: { $in: wallets } },
      { name: 1, email: 1, walletAddress: 1 }
    );

    res.json(students);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Mark Attendance
app.post("/mark-attendance", async (req, res) => {
  try {
    const attendance = new Attendance({
      studentId: req.body.studentId,
      sessionId: req.body.sessionId,
      timestamp: new Date()
    });

    await attendance.save();
    res.json({ message: "Attendance Marked ✅" });
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get Attendance
app.get("/attendance/:sessionId", async (req, res) => {
  try {
    const data = await Attendance.find({ sessionId: req.params.sessionId });
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

// =====================
// Start Server
// =====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
