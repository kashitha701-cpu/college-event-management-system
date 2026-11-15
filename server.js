const dns = require("dns");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const express = require("express");
const session = require("express-session");
const cors = require("cors");
const mongoose = require("mongoose");
const Event = require("./models/Event");
const Attendance = require("./models/Attendance");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed"));
        }
    }
});
const Registration = require("./registration");
mongoose.connect("mongodb+srv://college_event_user:Ashitha123@cluster0.yphbjhl.mongodb.net/")  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) => console.log("MongoDB connection error:", error));
const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());
app.use(session({
    secret: "college-event-secret",
    resave: false,
    saveUninitialized: false
}));
app.use(express.static(__dirname));
function requireAdmin(req, res, next) {

    if (req.session.isAdmin) {
        next();
    } else {
        res.status(401).json({
            message: "Admin login required"
        });
    }

}

function requireTeacher(req, res, next) {

    if (req.session.isTeacher) {
        next();
    } else {
        res.status(401).json({
            message: "Teacher login required"
        });
    }

}

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});
app.get("/api/events", async (req, res) => {
    try {
        const events = await Event.find();
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: "Error fetching events" });
    }
});
app.post("/api/admin/login", (req, res) => {

    const { username, password } = req.body;

    if (username === "admin" && password === "admin123") {

        req.session.isAdmin = true;

        res.json({
            message: "Admin login successful"
        });

    } else {

        res.status(401).json({
            message: "Invalid username or password"
        });

    }

});

app.post("/api/events", requireAdmin, async (req, res) => {
        try {
        const event = new Event(req.body);
        await event.save();
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: "Error creating event" });
    }
});



// Start server

app.put("/api/events/:id", requireAdmin, async (req, res) => {
        try {

        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        

        res.json({
            message: "Event updated successfully",
            event: updatedEvent
        });

    } catch (error) {

        console.error("Update event error:", error);

        res.status(500).json({
            message: "Error updating event"
        });

    }
});
app.delete("/api/events/:id", requireAdmin, async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);

        res.json({
            message: "Event deleted successfully"
        });

    } catch (error) {
        console.error("Delete event error:", error);

        res.status(500).json({
            message: "Error deleting event"
        });
    }
});

app.post("/api/registrations", async (req, res) => {
    try {
        const registration = new Registration(req.body);

        await registration.save();

        res.status(201).json({
            message: "Registration successful",
            registration: registration
        });

    } catch (error) {
        console.error("Registration error:", error);

        res.status(500).json({
            message: "Registration failed",
            error: error.message
        });
    }
});

// Get all registrations
app.get("/api/registrations", requireAdmin, async (req, res) => {
    try {

        const registrations = await Registration.find();

        res.json(registrations);

    } catch (error) {

        console.error("Error fetching registrations:", error);

        res.status(500).json({
            message: "Error fetching registrations"
        });

    }

});
app.post("/api/attendance", upload.single("attendanceFile"), async (req, res) => {
    try {
        const { studentId, studentName, eventName, eventDate } = req.body;

        if (!req.file) {
            return res.status(400).json({
                message: "Please upload a PDF attendance document."
            });
        }

        const attendance = new Attendance({
            studentId,
            studentName,
            eventName,
            eventDate,
            attendanceFile: req.file.filename
        });

        await attendance.save();

        res.status(201).json({
            message: "Attendance document uploaded successfully.",
            attendance
        });

    } catch (error) {
        console.error("Attendance upload error:", error);

        res.status(500).json({
            message: "Error uploading attendance document."
        });
    }
});

// Teacher - View Attendance Submissions
app.get("/api/attendance", requireTeacher, async (req, res) => {    try {
        const attendance = await Attendance.find().sort({ submittedAt: -1 });

        res.json(attendance);

    } catch (error) {
        console.error("Error fetching attendance:", error);

        res.status(500).json({
            message: "Error fetching attendance records."
        });
    }
});

// ==========================================
// STUDENT ATTENDANCE NOTIFICATIONS
// ==========================================

app.get("/api/student-attendance/:studentId", async (req, res) => {

    try {

        const attendance = await Attendance.find({
            studentId: req.params.studentId,
            status: { $in: ["Present", "Absent"] }
        }).sort({ lastUpdatedAt: -1 });

        res.json(attendance);

    } catch (error) {

        console.error("Student notification error:", error);

        res.status(500).json({
            message: "Error loading attendance notifications."
        });

    }

});
// Teacher - Update Attendance Status
app.put("/api/attendance/:id", requireTeacher, async (req, res) => {    try {

        const { status, remarks } = req.body;

        if (!["Present", "Absent"].includes(status)) {
            return res.status(400).json({
                message: "Invalid attendance status."
            });
        }

        const attendance = await Attendance.findByIdAndUpdate(
    req.params.id,
    {
        status: status,
        remarks: remarks || "",
        lastUpdatedAt: new Date()
    },
    { new: true }
);

        if (!attendance) {
            return res.status(404).json({
                message: "Attendance record not found."
            });
        }

        res.json({
            message: "Attendance updated successfully.",
            attendance
        });

    } catch (error) {

        console.error("Attendance update error:", error);

        res.status(500).json({
            message: "Error updating attendance."
        });
    }
});

// ==========================================
// TEACHER LOGIN
// ==========================================

app.post("/api/teacher-login", (req, res) => {

    const { username, password } = req.body;

    if (username === "teacher" && password === "teacher123") {

        req.session.isTeacher = true;

        return res.json({
            success: true,
            message: "Teacher login successful."
        });

    }

    res.status(401).json({
        success: false,
        message: "Invalid teacher username or password."
    });

});

app.listen(PORT, () => {    
    console.log(`Server running at http://localhost:${PORT}`);
});



