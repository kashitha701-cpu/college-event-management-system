/* ==========================================================================
   COLLEGE EVENT MANAGEMENT SYSTEM - script.js
   Plain JavaScript only. Works with the existing index.html and style.css.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    /* ======================================================================
       1. SETUP: find the elements that already exist in the HTML
       ====================================================================== */
    var header = document.querySelector('.site-header');
    var upcomingGrid = document.getElementById('upcoming-events-list');

    var previousGrid = document.getElementById('previous-events-list');
    var categoryCards = document.querySelectorAll('.category-card');

    // Your HTML has no search box yet. If you add one later with one of these
    // selectors, search will start working automatically.
    var searchInput = document.querySelector('#event-search, #search-input, input[type="search"]');

    var activeCategory = 'all'; // 'all' means no category filter
    var searchTerm = '';        // text typed in the search box (if it exists)

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


    /* ======================================================================
       2. MOBILE NAVIGATION
       Your HTML has no menu button, so nothing is added here.
       The CSS already wraps the links onto a second row on small screens.
       ====================================================================== */


    /* ======================================================================
       3. SMOOTH NAVIGATION
       ====================================================================== */
    function scrollToTarget(target) {
        var top = 0;

        // "#home" is the header itself, so just go to the top of the page
        if (target.id !== 'home') {
            var headerHeight = header ? header.offsetHeight : 0;
            top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        }

        window.scrollTo({
            top: Math.max(top, 0),
            behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
    }

    // One click listener for every link on the page
    document.addEventListener('click', function (event) {
        var link = event.target.closest('a');
        if (!link) return;

        var href = link.getAttribute('href');
        if (!href) return;

        // Placeholder links (href="#") would jump to the top, so stop that.
        // Later these will point to real pages (login, event details, etc.).
        if (href === '#') {
            event.preventDefault();
            return;
        }

        // Links like #about, #contact, #upcoming-events
        if (href.charAt(0) === '#') {
            var target = document.getElementById(decodeURIComponent(href.slice(1)));
            if (target) {
                event.preventDefault();
                scrollToTarget(target);

                // Update the address bar without the page jumping
                try {
                    history.pushState(null, '', href);
                } catch (error) {
                    /* ignore: some browsers restrict this on local files */
                }
            }
        }
    });


    /* ======================================================================
       4. UPCOMING vs PREVIOUS EVENTS (based on today's date)
       Reads the <time datetime="YYYY-MM-DD"> inside every event card.
       ====================================================================== */

    // Turn "2026-12-12" into a Date at local midnight
    function parseDate(text) {
        if (!text) return null;
        var parts = text.split('-');
        if (parts.length < 3) return null;
        var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return isNaN(date.getTime()) ? null : date;
    }

    function getCardDate(card) {
        var timeElement = card.querySelector('time[datetime]');
        return timeElement ? parseDate(timeElement.getAttribute('datetime')) : null;
    }

    function getToday() {
        var now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    // Build a "previous event" card (same structure as your existing ones)
    function buildPreviousCard(upcomingCard) {
        var title = upcomingCard.querySelector('.event-title');
        var category = upcomingCard.querySelector('.event-category');
        var description = upcomingCard.querySelector('.event-description');
        var timeElement = upcomingCard.querySelector('time[datetime]');

        var card = document.createElement('article');
        card.className = 'previous-event-card';
        card.setAttribute('data-event-id', upcomingCard.getAttribute('data-event-id') || '');
        card.setAttribute('data-category', upcomingCard.getAttribute('data-category') || '');
        card.setAttribute('data-status', 'completed');

        var badge = document.createElement('div');
        badge.className = 'previous-event-badge';
        badge.textContent = 'Completed';

        var heading = document.createElement('h3');
        heading.className = 'previous-event-title';
        heading.textContent = title ? title.textContent : 'Event';

        var meta = document.createElement('ul');
        meta.className = 'previous-event-meta';

        var dateItem = document.createElement('li');
        dateItem.className = 'event-date';
        dateItem.appendChild(document.createTextNode('📅 '));
        if (timeElement) dateItem.appendChild(timeElement.cloneNode(true));

        var categoryItem = document.createElement('li');
        categoryItem.className = 'event-category';
        categoryItem.textContent = '🏷️ ' + (category ? category.textContent : '');

        meta.appendChild(dateItem);
        meta.appendChild(categoryItem);

        var text = document.createElement('p');
        text.className = 'previous-event-description';
        text.textContent = description ? description.textContent.trim() : '';

        var button = document.createElement('a');
        button.href = '#';
        button.className = 'btn btn-outline btn-view-event';
        button.textContent = 'View Event';

        card.appendChild(badge);
        card.appendChild(heading);
        card.appendChild(meta);
        card.appendChild(text);
        card.appendChild(button);

        return card;
    }

    // Upcoming cards whose date has passed move into the Previous Events section
    function moveExpiredEvents() {
        if (!upcomingGrid || !previousGrid) return;

        var today = getToday();
        var upcomingCards = upcomingGrid.querySelectorAll('.upcoming-event-card');

        upcomingCards.forEach(function (card) {
            var date = getCardDate(card);
            if (date && date < today) {
                previousGrid.appendChild(buildPreviousCard(card));
                card.parentNode.removeChild(card);
            }
        });
    }

    // direction: 1 = oldest first (upcoming), -1 = newest first (previous)
    function sortCards(grid, direction) {
        if (!grid) return;

        var cards = Array.prototype.slice.call(grid.querySelectorAll('article'));
        cards.sort(function (a, b) {
            var dateA = getCardDate(a);
            var dateB = getCardDate(b);
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return (dateA - dateB) * direction;
        });

        cards.forEach(function (card) {
            grid.appendChild(card);
        });
    }


    /* ======================================================================
       5. CATEGORY FILTER + SEARCH
       ====================================================================== */

    // Does this card match the selected category and the search text?
    function cardMatches(card) {
        var cardCategory = (card.getAttribute('data-category') || '').toLowerCase();

        if (activeCategory !== 'all' && cardCategory !== activeCategory) {
            return false;
        }

        if (searchTerm) {
            var title = card.querySelector('.event-title, .previous-event-title');
            var categoryLabel = card.querySelector('.event-category');
            var venue = card.querySelector('.event-venue');

            var searchableText = [
                title ? title.textContent : '',
                categoryLabel ? categoryLabel.textContent : '',
                cardCategory,
                venue ? venue.textContent : ''
            ].join(' ').toLowerCase();

            if (searchableText.indexOf(searchTerm) === -1) {
                return false;
            }
        }

        return true;
    }

    // Show or hide the "no events" message under a grid
    // (created by JavaScript only when it is needed)
    function updateEmptyMessage(grid, visibleCount, defaultText) {
        var message = grid.nextElementSibling;

        if (!message || !message.classList.contains('no-events-message')) {
            message = document.createElement('p');
            message.className = 'no-events-message';
            message.style.textAlign = 'center';
            message.style.padding = '24px 0';
            message.style.color = '#64748b';
            grid.insertAdjacentElement('afterend', message);
        }

        var filtersActive = activeCategory !== 'all' || searchTerm !== '';
        message.textContent = filtersActive ? 'No events match your selection.' : defaultText;
        message.hidden = visibleCount > 0;
    }

    // Apply the filters to one grid of cards
    function filterGrid(grid, defaultText) {
        if (!grid) return;

        var cards = grid.querySelectorAll('article');
        var visibleCount = 0;

        cards.forEach(function (card) {
            if (cardMatches(card)) {
                card.style.display = '';   // show (back to the CSS default)
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        updateEmptyMessage(grid, visibleCount, defaultText);
    }

    function updateEvents() {
        filterGrid(upcomingGrid, 'No upcoming events at the moment. Please check back soon!');
        filterGrid(previousGrid, 'No previous events recorded yet.');
    }

    // Category cards: click to filter, click the same card again to clear
    categoryCards.forEach(function (card) {
        card.setAttribute('aria-pressed', 'false');

        card.addEventListener('click', function (event) {
            event.preventDefault();

            var selected = (card.getAttribute('data-category') || '').toLowerCase();
            var isSame = activeCategory === selected;

            activeCategory = isSame ? 'all' : selected;

            // Mark the selected card (add CSS for .category-card.active if you want a highlight)
            categoryCards.forEach(function (other) {
                var isActive = other === card && !isSame;
                other.classList.toggle('active', isActive);
                other.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });

            updateEvents();

            // Take the user to the filtered events
            if (!isSame && upcomingGrid) {
                var section = document.getElementById('upcoming-events');
                if (section) scrollToTarget(section);
            }
        });
    });

    // Search box (only if one exists in the HTML)
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            searchTerm = searchInput.value.trim().toLowerCase();
            updateEvents();
        });
    }


    /* ======================================================================
       6. RUN WHEN THE PAGE LOADS
       ====================================================================== */
    moveExpiredEvents();
    sortCards(upcomingGrid, 1);    // soonest event first
    sortCards(previousGrid, -1);   // most recent past event first
    updateEvents();
});

async function loadEventsFromDatabase() {
    try {
        const response = await fetch("http://localhost:3000/api/events");
        const events = await response.json();

        console.log("Events from MongoDB:", events);
    } catch (error) {
        console.error("Error loading events:", error);
    }
}

loadEventsFromDatabase();
async function displayDatabaseEvents() {
    const upcomingGrid = document.getElementById("upcoming-events-list");

    try {
        const response = await fetch("http://localhost:3000/api/events");
        const events = await response.json();

        events.forEach(function(event) {
            var card = document.createElement("article");
card.className = "event-card upcoming-event-card";
card.innerHTML = `
    <div class="event-image">
        <div class="image-placeholder">Event Image</div>
    </div>

    <div class="event-body">

        <span class="event-category">${event.category}</span>

        <h3 class="event-title">${event.title}</h3>

        <ul class="event-meta">
            <li class="event-date">📅 ${event.date}</li>
            <li class="event-time">🕘 ${event.time}</li>
            <li class="event-venue">📍 ${event.venue}</li>
        </ul>

        <p class="event-description">
            ${event.description}
        </p>

    </div>

    <div class="event-actions">
        <a href="#" class="btn btn-outline btn-view-details">
            View Details
        </a>

        <a href="#" class="btn btn-primary btn-register">
            Register Now
        </a>
    </div>
`;

            upcomingGrid.appendChild(card);
        });
    } catch (error) {
        console.error("Error displaying database events:", error);
    }
}

displayDatabaseEvents();

// Registration Form
document.addEventListener("DOMContentLoaded", function() {

    // Register button - works for both existing and newly added events
    document.addEventListener("click", function(event) {

        if (event.target.classList.contains("btn-register")) {

            event.preventDefault();

            const button = event.target;
            const eventCard = button.closest(".event-card");

            if (eventCard) {

                const eventTitle = eventCard.querySelector(".event-title").textContent;

                document.getElementById("selectedEvent").value = eventTitle;

                document.getElementById("registrationModal").style.display = "flex";
            }
        }
    });


    // Close registration form
    const closeRegistration = document.getElementById("closeRegistration");

    if (closeRegistration) {

        closeRegistration.addEventListener("click", function() {

            document.getElementById("registrationModal").style.display = "none";

        });
    }


    // Submit registration form
    document.getElementById("registrationForm").addEventListener("submit", function(event) {

        event.preventDefault();

        const name = document.getElementById("studentName").value;
        const email = document.getElementById("studentEmail").value;
        const phone = document.getElementById("studentPhone").value;
        const department = document.getElementById("studentDepartment").value;
        const eventName = document.getElementById("selectedEvent").value;


        // Check empty fields
        if (
            name.trim() === "" ||
            email.trim() === "" ||
            phone.trim() === "" ||
            department.trim() === ""
        ) {

            alert("Invalid! Please fill the form.");
            return;
        }


        fetch("http://localhost:3000/api/registrations", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name: name,
                email: email,
                phone: phone,
                department: department,
                eventName: eventName
            })

        })

        .then(response => response.json())

        .then(data => {

            console.log("Registration response:", data);

            if (data.message) {
                alert(data.message);
            } else {
                alert("Registration successful!");
            }

            document.getElementById("registrationForm").reset();

            document.getElementById("registrationModal").style.display = "none";

        })

        .catch(error => {

            console.error("Registration error:", error);

            alert("Registration failed.");

        });

    });

});
// Admin Add Event
document.addEventListener("DOMContentLoaded", function () {

    const adminEventForm = document.getElementById("adminEventForm");

    if (adminEventForm) {

        adminEventForm.addEventListener("submit", async function (e) {

            e.preventDefault();

            const eventData = {
                title: document.getElementById("eventTitle").value,
                category: document.getElementById("eventCategory").value,
                date: document.getElementById("eventDate").value,
                time: document.getElementById("eventTime").value,
                venue: document.getElementById("eventVenue").value,
                description: document.getElementById("eventDescription").value
            };

            try {

                const response = await fetch("/api/events", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(eventData)
                });

                const data = await response.json();

                if (response.ok) {
                    alert("Event added successfully!");

                    adminEventForm.reset();

                    location.reload();
                } else {
                    alert("Error adding event: " + data.message);
                }

            } catch (error) {
                console.error("Error:", error);
                alert("Failed to add event.");
            }

        });

    }

});

async function loadAdminEvents() {

    const adminEventsList = document.getElementById("adminEventsList");

    if (!adminEventsList) return;

    try {

        const response = await fetch("/api/events");
        const events = await response.json();

        adminEventsList.innerHTML = "";

        events.forEach(function(event) {

            const eventItem = document.createElement("div");

eventItem.innerHTML = `
    <h3>${event.title}</h3>

    <p>Category: ${event.category}</p>
    <p>Date: ${event.date}</p>
    <p>Time: ${event.time}</p>
    <p>Venue: ${event.venue}</p>

    <button class="edit-event-btn" data-id="${event._id}">
    Edit Event
</button>

<button class="delete-event-btn" data-id="${event._id}">
        Delete Event
    </button>

    <hr>
`;

            adminEventsList.appendChild(eventItem);

        });

    } catch (error) {

        console.error("Error loading admin events:", error);

    }
}

document.addEventListener("DOMContentLoaded", function() {
    loadAdminEvents();
});
document.addEventListener("click", async function(event) {

    if (event.target.classList.contains("delete-event-btn")) {

        const eventId = event.target.getAttribute("data-id");

        const response = await fetch("/api/events/" + eventId, {
            method: "DELETE"
        });

        const data = await response.json();

        if (response.ok) {

            alert(data.message);

            loadAdminEvents();

            location.reload();

        } else {

            alert("Error deleting event.");

        }

    }

});

document.addEventListener("click", async function(event) {

    if (event.target.classList.contains("edit-event-btn")) {

        const eventId = event.target.getAttribute("data-id");

        try {

            const response = await fetch("/api/events");
            const events = await response.json();

            const selectedEvent = events.find(function(event) {
                return event._id === eventId;
            });

            if (!selectedEvent) {
                alert("Event not found.");
                return;
            }

            document.getElementById("editEventId").value = selectedEvent._id;
            document.getElementById("editEventTitle").value = selectedEvent.title;
            document.getElementById("editEventCategory").value = selectedEvent.category;
            document.getElementById("editEventDate").value = selectedEvent.date;
            document.getElementById("editEventTime").value = selectedEvent.time;
            document.getElementById("editEventVenue").value = selectedEvent.venue;
            document.getElementById("editEventDescription").value = selectedEvent.description;

            document.getElementById("editEventSection").style.display = "block";

            document.getElementById("editEventSection").scrollIntoView({
                behavior: "smooth"
            });

        } catch (error) {

            console.error("Error loading event:", error);

            alert("Failed to load event.");

        }

    }

});
// Save Edited Event
document.addEventListener("DOMContentLoaded", function () {

    const editEventForm = document.getElementById("editEventForm");

    if (!editEventForm) return;

    editEventForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const eventId = document.getElementById("editEventId").value;

        const updatedEvent = {
            title: document.getElementById("editEventTitle").value,
            category: document.getElementById("editEventCategory").value,
            date: document.getElementById("editEventDate").value,
            time: document.getElementById("editEventTime").value,
            venue: document.getElementById("editEventVenue").value,
            description: document.getElementById("editEventDescription").value
        };

        try {

            const response = await fetch("/api/events/" + eventId, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(updatedEvent)
            });

            const data = await response.json();

            if (response.ok) {

                alert("Event updated successfully!");

                document.getElementById("editEventSection").style.display = "none";

                location.reload();

            } else {

                alert("Error updating event: " + data.message);

            }

        } catch (error) {

            console.error("Update error:", error);

            alert("Failed to update event.");

        }

    });

});


async function loadDashboardData() {

    try {

        const eventsResponse = await fetch("/api/events");
        const events = await eventsResponse.json();

        document.getElementById("totalEvents").textContent = events.length;

const today = new Date();
today.setHours(0, 0, 0, 0);
        let upcoming = 0;
        let previous = 0;

        events.forEach(function(event) {

            const eventDate = new Date(event.date);

            if (eventDate >= today) {
                upcoming++;
            } else {
                previous++;
            }

        });

        document.getElementById("upcomingEvents").textContent = upcoming;
        document.getElementById("previousEvents").textContent = previous;

        const registrationsResponse = await fetch("/api/registrations");

if (registrationsResponse.ok) {
    const registrations = await registrationsResponse.json();

    document.getElementById("totalRegistrations").textContent =
        registrations.length;
} else {
    document.getElementById("totalRegistrations").textContent = "0";
}
    } catch (error) {

        console.error("Dashboard error:", error);

    }

}
// Load Student Registrations
document.addEventListener("DOMContentLoaded", function () {
    // Dashboard data will load after admin login.
});

async function loadRegistrations() {

    const registrationsList = document.getElementById("registrationsList");

    if (!registrationsList) return;

    try {

const response = await fetch("/api/registrations");

if (!response.ok) {
    registrationsList.innerHTML =
        "<p>Please login as admin to view registrations.</p>";
    return;
}

const registrations = await response.json();

registrationsList.innerHTML = "";

        if (registrations.length === 0) {

            registrationsList.innerHTML =
                "<p>No registrations yet.</p>";

            return;
        }

        registrations.forEach(function (registration) {

            const registrationItem = document.createElement("div");

            registrationItem.className = "registration-item";

            registrationItem.innerHTML = `
                <h3>${registration.name}</h3>

                <p><strong>Email:</strong> ${registration.email}</p>

                <p><strong>Phone:</strong> ${registration.phone}</p>

                <p><strong>Department:</strong> ${registration.department}</p>

                <p><strong>Event:</strong> ${registration.eventName}</p>
            `;

            registrationsList.appendChild(registrationItem);

        });

    } catch (error) {

        console.error("Error loading registrations:", error);

    }

}
// Search and Filter Events
document.addEventListener("DOMContentLoaded", function () {

    const searchInput = document.getElementById("eventSearch");
    const categoryFilter = document.getElementById("eventCategoryFilter");

    if (!searchInput || !categoryFilter) return;

    function filterEvents() {

        const searchText = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value.toLowerCase();

        const eventCards = document.querySelectorAll(".event-card");

        eventCards.forEach(function (card) {

            const title = card.querySelector(".event-title")?.textContent.toLowerCase() || "";
            const category = card.querySelector(".event-category")?.textContent.toLowerCase() || "";
            const description = card.querySelector(".event-description")?.textContent.toLowerCase() || "";

            const matchesSearch =
                title.includes(searchText) ||
                category.includes(searchText) ||
                description.includes(searchText);

            const matchesCategory =
                selectedCategory === "all" ||
                category.includes(selectedCategory);

            if (matchesSearch && matchesCategory) {
                card.style.display = "";
            } else {
                card.style.display = "none";
            }

        });
    }

    searchInput.addEventListener("input", filterEvents);
    categoryFilter.addEventListener("change", filterEvents);

});
// Separate Upcoming and Previous Events
document.addEventListener("DOMContentLoaded", function () {

    const upcomingList = document.getElementById("upcoming-events-list");
    const previousList = document.getElementById("previous-events-list");

    if (!upcomingList || !previousList) return;

    const eventCards = Array.from(upcomingList.querySelectorAll(".event-card"));
    const today = new Date();

    eventCards.forEach(function (card) {

        const dateElement = card.querySelector(".event-date");

        if (!dateElement) return;

const dateText = dateElement.textContent
    .replace("📅", "")
    .trim()
    .replace(/-/g, " ");

const eventDate = new Date(dateText);        if (eventDate < today) {
            previousList.appendChild(card);
        }

    });

});





// Event Details
document.addEventListener("DOMContentLoaded", function () {

    document.addEventListener("click", function (event) {

        if (event.target.classList.contains("btn-view-details")) {

            event.preventDefault();

            const button = event.target;
            const eventCard = button.closest(".event-card");

            if (!eventCard) return;

            const title = eventCard.querySelector(".event-title")?.textContent || "";
            const category = eventCard.querySelector(".event-category")?.textContent || "";
            const date = eventCard.querySelector(".event-date")?.textContent || "";
            const time = eventCard.querySelector(".event-time")?.textContent || "";
            const venue = eventCard.querySelector(".event-venue")?.textContent || "";
            const description = eventCard.querySelector(".event-description")?.textContent || "";

            document.getElementById("detailsTitle").textContent = title;
            document.getElementById("detailsCategory").textContent = category;
            document.getElementById("detailsDate").textContent = date;
            document.getElementById("detailsTime").textContent = time;
            document.getElementById("detailsVenue").textContent = venue;
            document.getElementById("detailsDescription").textContent = description;
            document.getElementById("eventDetailsModal").style.display = "flex";

        }

    });

    const closeButton = document.getElementById("closeEventDetails");

    if (closeButton) {

        closeButton.addEventListener("click", function () {

            document.getElementById("eventDetailsModal").style.display = "none";

        });

    }

});
// Admin Login
document.addEventListener("DOMContentLoaded", function () {

    const adminLoginForm = document.getElementById("adminLoginForm");

    if (!adminLoginForm) return;

    adminLoginForm.addEventListener("submit", async function (event) {

        event.preventDefault();
        

        const username = document.getElementById("adminUsername").value;
        const password = document.getElementById("adminPassword").value;

        try {

            const response = await fetch("/api/admin/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const data = await response.json();
            console.log("LOGIN RESPONSE:", response.status, data);

if (response.ok) {

    alert("Admin login successful!");

    const adminSections = document.querySelectorAll(".admin-section");

    adminSections.forEach(function (section) {
        section.classList.remove("admin-hidden");
    });

    const loginSection =
        document.querySelector(".admin-login-section");

    if (loginSection) {
        loginSection.style.display = "none";
    }

    loadDashboardData();
    loadAdminEvents();
    loadRegistrations();

} else {

    alert(data.message || "Invalid admin login.");

}

        } catch (error) {

            console.error("Login error:", error);
            alert("Login failed.");

        }

    });

});
// Student Attendance Upload
document.addEventListener("DOMContentLoaded", function () {

    const attendanceForm = document.getElementById("attendanceForm");

    console.log("Attendance form found:", attendanceForm);

    if (!attendanceForm) return;

    attendanceForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const formData = new FormData(attendanceForm);
        const studentId = document.getElementById("attendanceStudentId").value.trim();
sessionStorage.setItem("studentId", studentId);
        const message = document.getElementById("attendanceMessage");

        try {

            const response = await fetch("/api/attendance", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

if (response.ok) {

    message.textContent =
        data.message || "Attendance submitted successfully.";

    message.style.display = "block";

} else {

    message.textContent =
        data.message || "Error submitting attendance.";

    message.style.display = "block";
}

} catch (error) {

            console.error("Attendance error:", error);

            message.textContent =
                "Server error. Please try again.";

            message.style.display = "block";
        }

    });

});
// ==========================================
// TEACHER ATTENDANCE VERIFICATION
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
    // Teacher attendance will load after successful teacher login
});

async function loadTeacherAttendance() {

    const attendanceList =
        document.getElementById("teacherAttendanceList");

    if (!attendanceList) return;

    try {

        const response = await fetch("/api/attendance");

        const attendance = await response.json();

        if (!response.ok) {
            throw new Error("Unable to load attendance");
        }

        if (attendance.length === 0) {

            attendanceList.innerHTML =
                "<p>No attendance submissions found.</p>";

            return;
        }

        let tableHTML = `
            <div class="attendance-table-container">

                <table class="attendance-table">

                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Student</th>
                            <th>Event</th>
                            <th>Date</th>
                            <th>Attendance PDF</th>
                            <th>Status</th>
<th>Remarks</th>
<th>Action</th>                        </tr>
                    </thead>

                    <tbody>
        `;

        attendance.forEach(function (record) {

            let statusClass = "status-pending";

            if (record.status === "Present") {
                statusClass = "status-present";
            }

            if (record.status === "Absent") {
                statusClass = "status-rejected";
            }

            tableHTML += `
                <tr>

                    <td>${record.studentId}</td>

                    <td>
                        <span class="student-name">
                            ${record.studentName}
                        </span>
                    </td>

                    <td>${record.eventName}</td>

                    <td>${record.eventDate}</td>

                    <td>
                        <a
                            href="/uploads/${record.attendanceFile}"
                            target="_blank"
                            class="view-pdf-btn"
                        >
                            📄 View PDF
                        </a>
                    </td>

                    <td>
                        <span class="${statusClass}">
                            ${record.status}
                        </span>
                    </td>

                   <td>
    ${
        record.status === "Pending"
        ? `
            <input
                type="text"
                id="remark-${record._id}"
                placeholder="Enter remark"
                class="attendance-remark-input"
            >

            <br>

            <button
                class="attendance-action-btn present-btn"
                onclick="updateAttendance('${record._id}', 'Present')"
            >
                ✓ Present
            </button>

            <button
                class="attendance-action-btn reject-btn"
                onclick="updateAttendance('${record._id}', 'Absent')"
            >
                ✕ Absent
            </button>
        `
        : `
            <span>${record.remarks || "No remark"}</span>
        `
    }
</td>

                </tr>
            `;
        });

        tableHTML += `
                    </tbody>

                </table>

            </div>
        `;

        attendanceList.innerHTML = tableHTML;

    } catch (error) {

        console.error("Teacher attendance error:", error);

        attendanceList.innerHTML =
            "<p>Unable to load attendance submissions.</p>";
    }
}


// ==========================================
// UPDATE ATTENDANCE
// ==========================================

async function updateAttendance(attendanceId, status) {
const remarkInput =
    document.getElementById(`remark-${attendanceId}`);

const remarks =
    remarkInput ? remarkInput.value.trim() : "";
    try {

        const response = await fetch(
            `/api/attendance/${attendanceId}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

               body: JSON.stringify({
    status: status,
    remarks: remarks
})
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to update attendance.");
            return;
        }

alert(
    `Attendance marked as ${status} successfully.`
);

loadTeacherAttendance();

loadAttendanceNotifications();
    } catch (error) {

        console.error("Update attendance error:", error);

        alert("Server error. Please try again.");
    }
}
// ==========================================
// STUDENT ATTENDANCE NOTIFICATIONS
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    const savedStudentId = sessionStorage.getItem("studentId");

    if (savedStudentId) {
        loadAttendanceNotifications(savedStudentId);
    }

});

async function loadAttendanceNotifications(studentIdFromForm = null) {

    const notificationBox =
        document.getElementById("attendanceNotifications");

    if (!notificationBox) return;

    const studentId =
        studentIdFromForm ||
        sessionStorage.getItem("studentId") ||
        document.getElementById("attendanceStudentId")?.value.trim();

    if (!studentId) {

        notificationBox.innerHTML =
            "<p>Enter your Student ID / USN to view attendance notifications.</p>";

        return;
    }

    try {

        const response = await fetch(
            `/api/student-attendance/${encodeURIComponent(studentId)}`
        );

        const attendance = await response.json();

        if (!response.ok) {
            throw new Error("Unable to load notifications");
        }

        const updatedRecords = attendance.filter(function (record) {

            return record.status === "Present" ||
                   record.status === "Absent";

        });

        if (updatedRecords.length === 0) {

            notificationBox.innerHTML =
                "<p>No new attendance updates.</p>";

            return;
        }

        notificationBox.innerHTML = "";

        updatedRecords.forEach(function (record) {

            const notification =
                document.createElement("div");

            if (record.status === "Present") {

                notification.className =
                    "attendance-notification notification-present";

                notification.innerHTML = `
                    <strong>🔔 Attendance Updated</strong>

                    <p>
                        Your teacher has marked your attendance as
                        <strong>Present</strong>.
                    </p>

                    <p>
                        <strong>Event:</strong>
                        ${record.eventName}
                    </p>

                    <p>
                        <strong>Date:</strong>
                        ${record.eventDate}
                    </p>

                    <p>
    <strong>Teacher Remark:</strong>
    ${record.remarks || "No remark added."}
</p>
                `;

            } else {

                notification.className =
                    "attendance-notification notification-absent";

                notification.innerHTML = `
                    <strong>🔔 Attendance Updated</strong>

                    <p>
                        Your teacher has marked your attendance as
                        <strong>Absent</strong>.
                    </p>

                    <p>
                        <strong>Event:</strong>
                        ${record.eventName}
                    </p>

                    <p>
                        <strong>Date:</strong>
                        ${record.eventDate}
                    </p>
                `;

            }

            notificationBox.appendChild(notification);

        });

    } catch (error) {

        console.error(
            "Attendance notification error:",
            error
        );

        notificationBox.innerHTML =
            "<p>Unable to load attendance notifications.</p>";

    }

}
// ==========================================
// ==========================================
// ==========================================
// TEACHER LOGIN
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    const teacherLoginForm =
        document.getElementById("teacherLoginForm");

    if (!teacherLoginForm) {
        console.log("Teacher login form not found.");
        return;
    }

    console.log("Teacher login form found.");

    teacherLoginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const username =
            document.getElementById("teacherUsername").value.trim();

        const password =
            document.getElementById("teacherPassword").value.trim();

        const message =
            document.getElementById("teacherLoginMessage");

        console.log("Teacher login button clicked.");
        console.log("Username:", username);

        try {

            const response = await fetch("/api/teacher-login", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    username: username,
                    password: password
                })

            });

            const data = await response.json();

            console.log("Teacher login response:", response.status, data);

            if (response.ok) {

    alert("Teacher login successful!");

    message.textContent =
        "✅ Teacher login successful.";

    message.style.display = "block";
    message.style.color = "green";

    // Show teacher attendance section
    const teacherSection =
        document.querySelector(".teacher-attendance-section");

    if (teacherSection) {
        teacherSection.style.display = "block";
    }

    console.log("Loading teacher attendance...");

    loadTeacherAttendance();

} else {

                message.textContent =
                    "❌ " + (data.message || "Invalid login.");

                message.style.display = "block";
                message.style.color = "red";
            }

        } catch (error) {

            console.error("Teacher login error:", error);

            message.textContent =
                "❌ Server error. Please try again.";

            message.style.display = "block";
            message.style.color = "red";
        }

    });

});