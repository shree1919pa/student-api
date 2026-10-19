require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Student = require("./models/Student");

const app = express();

app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "Student API is running successfully"
  });
});

// Get all students
app.get("/api/students", async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get student by ID
app.get("/api/students/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create student
app.post("/api/students", async (req, res) => {
  try {
    const { name, email, age, course } = req.body;

    if (
      typeof name !== "string" || !name.trim() ||
      typeof email !== "string" || !email.trim() ||
      !Number.isFinite(age) || age < 1 ||
      typeof course !== "string" || !course.trim()
    ) {
      return res.status(400).json({
        message: "Enter a valid name, email, age and course"
      });
    }

    const student = await Student.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      age,
      course: course.trim()
    });

    res.status(201).json({
      message: "Student created successfully",
      student
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email already exists"
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: error.message });
  }
});

// Update student
app.put("/api/students/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    const allowed = ["name", "email", "age", "course"];
    const updates = {};

    for (const key of allowed) {
      if (Object.hasOwn(req.body, key)) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Provide at least one student field to update"
      });
    }

    if (
      ("name" in updates &&
        (typeof updates.name !== "string" || !updates.name.trim())) ||
      ("email" in updates &&
        (typeof updates.email !== "string" || !updates.email.trim())) ||
      ("course" in updates &&
        (typeof updates.course !== "string" || !updates.course.trim())) ||
      ("age" in updates &&
        (!Number.isFinite(updates.age) || updates.age < 1))
    ) {
      return res.status(400).json({
        message: "Invalid student field values"
      });
    }

    if (updates.name) updates.name = updates.name.trim();
    if (updates.email) updates.email = updates.email.trim().toLowerCase();
    if (updates.course) updates.course = updates.course.trim();

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({
      message: "Student updated successfully",
      student
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email already exists" });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: error.message });
  }
});

// Delete student
app.delete("/api/students/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start server after database connection
const PORT = process.env.PORT || 3000;

async function startServer() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from the .env file");
  }

  await mongoose.connect(process.env.MONGO_URI);

  console.log("MongoDB connected successfully");

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start application:", error.message);
  process.exit(1);
});