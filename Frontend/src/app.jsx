import React from "react";
import { Routes, Route, Link } from "react-router-dom";

import Student from "./pages/Student";
import Teacher from "./pages/Teacher";

function App() {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>🚀 FaceChain Attendance System</h1>

      {/* 🔗 Navigation */}
      <nav style={{ marginBottom: "20px" }}>
        <Link to="/" style={{ marginRight: "15px" }}>Home</Link>
        <Link to="/student" style={{ marginRight: "15px" }}>Student</Link>
        <Link to="/teacher">Teacher</Link>
      </nav>

      {/* 📍 Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/student" element={<Student />} />
        <Route path="/teacher" element={<Teacher />} />
      </Routes>
    </div>
  );
}

export default App;

///////////////////////////////////////////////////////
// 🏠 Simple Home Page
///////////////////////////////////////////////////////

function Home() {
  return (
    <div>
      <h2>Welcome to FaceChain 🎯</h2>

      <p>
        A blockchain-based attendance system using QR codes and wallet authentication.
      </p>

      <ul>
        <li>🎓 Students: Scan QR → Connect Wallet → Mark Attendance</li>
        <li>👨‍🏫 Teachers: Create Session → Generate QR → Track Attendance</li>
        <li>⛓️ Blockchain ensures tamper-proof records</li>
      </ul>

      <br />

      <h3>Quick Start:</h3>
      <ul>
        <li>Go to <b>Teacher</b> → Create Session</li>
        <li>Open QR link or scan</li>
        <li>Go to <b>Student</b> → Mark Attendance</li>
      </ul>
    </div>
  );
}