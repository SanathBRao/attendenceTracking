import React, { useState, useRef } from "react";
import { ethers } from "ethers";
import QRCode from "qrcode";

const CONTRACT_ADDRESS = "0x71b45128128f3a1Bf554a84F0fdc8cb724B9A5d0";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const FRONTEND_BASE_URL = window.location.origin + "/student";

const ABI = [/* 👉 paste SAME ABI here */];

function Teacher() {
  const [status, setStatus] = useState("");
  const [address, setAddress] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [attendees, setAttendees] = useState([]);

  const contractRef = useRef(null);
  const canvasRef = useRef(null);

  // 🔗 Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      setStatus("MetaMask not found ❌");
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      contractRef.current = contract;
      setAddress(accounts[0]);
      setStatus("Wallet connected ✅");
    } catch {
      setStatus("Connection failed ❌");
    }
  };

  // 🧠 Create session
  const createSession = async () => {
    if (!contractRef.current) {
      await connectWallet();
    }

    try {
      setStatus("Confirm transaction in MetaMask...");
      const tx = await contractRef.current.createSession();
      const receipt = await tx.wait();

      const event = receipt.events.find(e => e.event === "SessionCreated");
      const newSessionId = event.args.sessionId.toNumber();

      setSessionId(newSessionId);

      // 📷 Generate QR
      const qrData = `${FRONTEND_BASE_URL}?sessionId=${newSessionId}&contract=${CONTRACT_ADDRESS}`;

      await QRCode.toCanvas(canvasRef.current, qrData, {
        width: 280
      });

      setStatus("Session created ✅");
      loadAttendees(newSessionId);
    } catch (err) {
      console.error(err);
      setStatus("Session creation failed ❌");
    }
  };

  // 🛑 Close session
  const closeSession = async () => {
    if (!sessionId) {
      setStatus("No session ❌");
      return;
    }

    try {
      const tx = await contractRef.current.closeSession(sessionId);
      await tx.wait();

      setStatus("Session closed ✅");
    } catch {
      setStatus("Close failed ❌");
    }
  };

  // 📊 Load attendees
  const loadAttendees = async (id = sessionId) => {
    if (!id) return;

    try {
      const wallets = await contractRef.current.getAttendees(id);

      // fetch student details
      const res = await fetch(
        `${API_BASE_URL}/students/by-wallets?addresses=${wallets.join(",")}`
      );

      const students = await res.json();

      const map = {};
      students.forEach(s => {
        map[s.walletAddress.toLowerCase()] = s;
      });

      const list = wallets.map(addr => ({
        address: addr,
        name: map[addr.toLowerCase()]?.name || "Unknown",
        email: map[addr.toLowerCase()]?.email || ""
      }));

      setAttendees(list);
      setStatus("Attendees loaded ✅");
    } catch (err) {
      console.error(err);
      setStatus("Failed to load attendees ❌");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>👨‍🏫 Teacher Dashboard</h2>

      <button onClick={connectWallet}>Connect Wallet</button>
      <p>{address}</p>

      <br />

      <button onClick={createSession}>
        Create Session
      </button>

      <button onClick={closeSession}>
        Close Session
      </button>

      <button onClick={loadAttendees}>
        Refresh Attendees
      </button>

      <h3>Session ID: {sessionId}</h3>

      <canvas ref={canvasRef}></canvas>

      <h3>Attendees</h3>
      <ul>
        {attendees.map((s, i) => (
          <li key={i}>
            {s.name} ({s.email}) - {s.address}
          </li>
        ))}
      </ul>

      <p style={{ color: "green" }}>{status}</p>
    </div>
  );
}

export default Teacher;