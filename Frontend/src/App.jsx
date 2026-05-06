import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import Student from "./pages/Student";
import Teacher from "./pages/Teacher";

import "./App.css";

function Home() {
  return (
    <div className="card">
      <h2>🚀 Welcome to FaceChain</h2>

      <p>
        A blockchain-powered smart attendance system using MetaMask,
        QR scanning, geofencing, and tamper-proof attendance records.
      </p>

      <div className="home-grid">
        <div className="feature">
          <h3>👨‍🏫 Teacher Dashboard</h3>

          <p>
            Create attendance sessions, generate QR codes,
            manage classroom attendance, and monitor students live.
          </p>
        </div>

        <div className="feature">
          <h3>🎓 Student Dashboard</h3>

          <p>
            Scan QR codes, verify classroom location,
            connect MetaMask wallet, and securely mark attendance.
          </p>
        </div>

        <div className="feature">
          <h3>⛓️ Blockchain Security</h3>

          <p>
            Attendance records are stored on blockchain,
            making them transparent, immutable, and secure.
          </p>
        </div>
      </div>

      <div style={{ marginTop: "30px" }}>
        <Link to="/teacher">
          <button>Open Teacher Dashboard</button>
        </Link>

        <Link to="/student">
          <button className="secondary">
            Open Student Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <div className="header">
          <h1>🎯 FaceChain Attendance System</h1>

          <div className="nav">
            <Link to="/">Home</Link>

            <Link to="/teacher">
              Teacher
            </Link>

            <Link to="/student">
              Student
            </Link>
          </div>
        </div>

        <Routes>
          <Route path="/" element={<Home />} />

          <Route
            path="/teacher"
            element={<Teacher />}
          />

          <Route
            path="/student"
            element={<Student />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;