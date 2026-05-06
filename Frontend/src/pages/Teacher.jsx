import React, { useState, useRef } from "react";
import { ethers } from "ethers";
import QRCode from "qrcode";

const CONTRACT_ADDRESS = "0x71b45128128f3a1Bf554a84F0fdc8cb724B9A5d0";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ABI = [
  "function createSession() public returns (uint256)",
  "function closeSession(uint256 sessionId) public",
  "function getAttendees(uint256 sessionId) public view returns (address[])",
  "event SessionCreated(uint256 indexed sessionId, uint256 startTime)"
];

function Teacher() {
  const [status, setStatus] = useState("");
  const [address, setAddress] = useState("");
  const [sessionId, setSessionId] = useState(
    localStorage.getItem("facechain_sessionId") || ""
  );
  const [attendees, setAttendees] = useState([]);

  const contractRef = useRef(null);
  const canvasRef = useRef(null);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setStatus("MetaMask not found ❌");
        return false;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      contractRef.current = contract;
      setAddress(accounts[0]);
      setStatus("Wallet connected ✅");

      return true;
    } catch (err) {
      console.error(err);
      setStatus("Connection failed ❌ " + (err?.message || ""));
      return false;
    }
  };

  const createSession = async () => {
    if (!contractRef.current) {
      const connected = await connectWallet();
      if (!connected) return;
    }

    try {
      setStatus("Confirm transaction in MetaMask...");

      const tx = await contractRef.current.createSession();
      const receipt = await tx.wait();

      const event = receipt.events.find((e) => e.event === "SessionCreated");
      const newSessionId = event.args.sessionId.toNumber();

      setSessionId(newSessionId);
      localStorage.setItem("facechain_sessionId", newSessionId);

      const qrData = `${window.location.origin}/student?sessionId=${newSessionId}&contract=${CONTRACT_ADDRESS}`;

      await QRCode.toCanvas(canvasRef.current, qrData, {
        width: 280,
        margin: 2
      });

      setStatus("Session created ✅");
      await loadAttendees(newSessionId);
    } catch (err) {
      console.error(err);
      setStatus("Session creation failed ❌ " + (err?.reason || err?.message || ""));
    }
  };

  const closeSession = async () => {
    if (!sessionId) {
      setStatus("No session selected ❌");
      return;
    }

    if (!contractRef.current) {
      const connected = await connectWallet();
      if (!connected) return;
    }

    try {
      const tx = await contractRef.current.closeSession(sessionId);
      await tx.wait();

      setStatus("Session closed ✅");
    } catch (err) {
      console.error(err);
      setStatus("Close failed ❌ " + (err?.reason || err?.message || ""));
    }
  };

  const loadAttendees = async (id = sessionId) => {
    if (!id) {
      setStatus("No session ID ❌");
      return;
    }

    if (!contractRef.current) {
      const connected = await connectWallet();
      if (!connected) return;
    }

    try {
      const wallets = await contractRef.current.getAttendees(id);

      const res = await fetch(
        `${API_BASE_URL}/students/by-wallets?addresses=${encodeURIComponent(wallets.join(","))}`
      );

      const students = await res.json();

      const map = {};
      students.forEach((s) => {
        map[s.walletAddress.toLowerCase()] = s;
      });

      const list = wallets.map((addr) => ({
        address: addr,
        name: map[addr.toLowerCase()]?.name || "Unknown Student",
        email: map[addr.toLowerCase()]?.email || ""
      }));

      setAttendees(list);
      setStatus(`Loaded ${list.length} attendee(s) ✅`);
    } catch (err) {
      console.error(err);
      setStatus("Failed to load attendees ❌");
    }
  };

  return (
    <div className="card">
      <h2>👨‍🏫 Teacher Dashboard</h2>

      <button onClick={connectWallet}>Connect Wallet</button>

      {address && <p className="wallet">{address}</p>}

      <button onClick={createSession}>Create Session</button>
      <button className="secondary" onClick={closeSession}>Close Session</button>
      <button className="secondary" onClick={() => loadAttendees()}>Refresh Attendees</button>

      <h3>Session ID: {sessionId}</h3>

      <canvas ref={canvasRef}></canvas>

      <h3>Attendees</h3>

      {attendees.length === 0 ? (
        <p>No attendees yet.</p>
      ) : (
        attendees.map((s, i) => (
          <div className="attendee" key={i}>
            <b>{s.name}</b><br />
            {s.email && <span>{s.email}<br /></span>}
            <small>{s.address}</small>
          </div>
        ))
      )}

      <p className="status success">{status}</p>
    </div>
  );
}

export default Teacher;