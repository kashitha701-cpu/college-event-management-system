const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true
    },

    studentName: {
        type: String,
        required: true
    },

    eventName: {
        type: String,
        required: true
    },

    eventDate: {
        type: String,
        required: true
    },

    attendanceFile: {
        type: String,
        required: true
    },

    status: {
        type: String,
enum: ["Pending", "Present", "Absent"],      
  default: "Pending"
    },

    remarks: {
        type: String,
        default: ""
    },
    
lastUpdatedAt: {
    type: Date,
    default: Date.now
},
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Attendance", attendanceSchema);