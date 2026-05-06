import React, { useState, useRef } from "react";
import { ethers } from "ethers";
import { Html5Qrcode } from "html5-qrcode";

const CONTRACT_ADDRESS = "0x71b45128128f3a1Bf554a84F0fdc8cb724B9A5d0";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ABI = [/* 👉 paste your FULL ABI here (unchanged) */];

function Student() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [status, setStatus] = useState("");
  const [address, setAddress] = useState("");

  const providerRef = useRef(null);
  const signerRef = useRef(null);
  const contractRef = useRef(null);
  const qrRef = useRef(null);

  // 🔗 Connect MetaMask
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

      providerRef.current = provider;
      signerRef.current = signer;
      contractRef.current = contract;

      setAddress(accounts[0]);
      setStatus("Wallet connected ✅");
    } catch (err) {
      setStatus("Connection failed ❌");
    }
  };

  // 🧾 Register student (backend)
  const registerStudent = async () => {
    if (!name || !email || !address) {
      setStatus("Fill all details ❌");
      return false;
    }

    try {
      await fetch(API_BASE_URL + "/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          walletAddress: address
        })
      });

      return true;
    } catch {
      setStatus("Backend error ❌");
      return false;
    }
  };

  // ⛓️ Mark attendance
  const markAttendance = async () => {
    if (!sessionId) {
      setStatus("Enter or scan session ID ❌");
      return;
    }

    if (!contractRef.current) {
      await connectWallet();
    }

    const ok = await registerStudent();
    if (!ok) return;

    try {
      setStatus("Confirm transaction in MetaMask...");
      const tx = await contractRef.current.markAttendance(sessionId);
      await tx.wait();

      setStatus("Attendance marked ✅");
    } catch (err) {
      console.error(err);
      setStatus("Transaction failed ❌");
    }
  };

  // 📷 Start QR scanner
  const startQR = async () => {
    try {
      const qr = new Html5Qrcode("qr-reader");
      qrRef.current = qr;

      await qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          handleQR(decodedText);
          stopQR();
        }
      );

      setStatus("Scanning QR...");
    } catch (err) {
      setStatus("Camera error ❌");
    }
  };

  // 🛑 Stop QR scanner
  const stopQR = async () => {
    if (qrRef.current) {
      await qrRef.current.stop();
      qrRef.current.clear();
      qrRef.current = null;
    }
  };

  // 🔍 Parse QR
  const handleQR = (data) => {
    try {
      const url = new URL(data);
      const id = url.searchParams.get("sessionId");

      if (id) {
        setSessionId(id);
        setStatus("QR loaded ✅");
      } else {
        setStatus("Invalid QR ❌");
      }
    } catch {
      if (/^\d+$/.test(data)) {
        setSessionId(data);
        setStatus("Session loaded ✅");
      } else {
        setStatus("Invalid QR ❌");
      }
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🎓 Student Dashboard</h2>

      <button onClick={connectWallet}>Connect Wallet</button>
      <p>{address}</p>

      <br />

      <input
        placeholder="Name"
        onChange={(e) => setName(e.target.value)}
      />
      <br /><br />

      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <br /><br />

      <input
        placeholder="Session ID"
        value={sessionId}
        onChange={(e) => setSessionId(e.target.value)}
      />
      <br /><br />

      <button onClick={markAttendance}>
        Mark Attendance
      </button>

      <br /><br />

      <button onClick={startQR}>Scan QR</button>
      <button onClick={stopQR}>Stop QR</button>

      <div id="qr-reader" style={{ width: "300px", marginTop: "20px" }}></div>

      <p style={{ marginTop: "20px", color: "green" }}>
        {status}
      </p>
    </div>
  );
}

export default Student;