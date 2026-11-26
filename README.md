# College Event Management System

## Project Overview

The College Event Management System is a web-based application developed to make the management of college events easier and more organized.

The system helps manage college events, student registrations, teacher attendance verification, and attendance records in one place. It reduces manual work and provides a simple way to manage event-related activities.

## Objectives

- To make college event management easier.
- To allow students to register for events.
- To help teachers verify and manage attendance.
- To maintain event and attendance records.
- To reduce manual paperwork and improve organization.

## Main Features

### 1. Event Management
- Create and manage college events.
- Display available events to students.
- Store event information in the database.

### 2. Student Registration
- Students can register for available events.
- Registration details are stored for future reference.

### 3. Attendance Management
- Teachers can verify student attendance.
- Attendance records can be maintained digitally.
- Attendance-related files can be uploaded when required.

### 4. Database Management
- Event, registration, and attendance information is stored using MongoDB.
- The application uses Mongoose for database interaction.

### 5. Web Interface
- Simple and user-friendly interface.
- HTML is used for the page structure.
- CSS is used for styling.
- JavaScript is used for client-side functionality.

## Technologies Used

| Technology | Purpose |
|---|---|
| HTML | Website structure |
| CSS | Website styling |
| JavaScript | Frontend functionality |
| Node.js | Backend runtime |
| Express.js | Backend framework |
| MongoDB | Database |
| Mongoose | Database connection and data handling |
| GitHub | Source code management |
| Visual Studio Code | Development environment |

## Project Structure

```text
college-event-management-system/
│
├── models/
│   ├── Attendance.js
│   └── Event.js
│
├── uploads/
│
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── registration.js
├── script.js
├── server.js
├── style.css
└── README.md
```

## How the System Works

1. The user opens the College Event Management System.
2. Available college events are displayed.
3. Students can select an event and complete the registration process.
4. Registration information is stored in the database.
5. Teachers can verify student attendance.
6. Attendance information is maintained digitally.
7. The system provides an organized way to manage event-related records.

## How to Run the Project

### Step 1: Clone the repository

```bash
git clone https://github.com/kashitha701-cpu/college-event-management-system.git
```

### Step 2: Open the project

Open the downloaded project folder in Visual Studio Code.

### Step 3: Install dependencies

Open the terminal inside the project folder and run:

```bash
npm install
```

### Step 4: Configure the database

Make sure the MongoDB connection is configured correctly for the project.

If environment variables are used, create a `.env` file and add the required configuration.

### Step 5: Start the server

```bash
node server.js
```

### Step 6: Open the website

Open:

```text
http://localhost:3000/
```

## Benefits

- Reduces manual event management work.
- Makes student registration easier.
- Helps teachers manage attendance.
- Keeps event information organized.
- Provides a centralized system for event records.
- Saves time and improves efficiency.

## Future Enhancements

Some possible future improvements include:

- Student login and authentication.
- Admin dashboard.
- Email notifications.
- Event search and filtering.
- Automatic attendance reports.
- Event reminders.
- Improved mobile responsiveness.
- Online event feedback system.

## Project Status

The project is currently developed as a working web-based College Event Management System and is maintained through GitHub.

## Author

**Ashitha K**

BCA Student

---

## Repository

GitHub:  
https://github.com/kashitha701-cpu/college-event-management-system
