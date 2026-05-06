import React, { useEffect, useState, useRef } from "react";
import { ethers } from "ethers";
import { Html5Qrcode } from "html5-qrcode";

const CONTRACT_ADDRESS = "0x71b45128128f3a1Bf554a84F0fdc8cb724B9A5d0";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Your geofence location
const CLASS_LAT = 12.929782;
const CLASS_LNG = 77.622162;

// For final use: 100 or 200
// For testing from far away: 10000
const ALLOWED_RADIUS_METERS = 100;

const ABI = ["function markAttendance(uint256 sessionId) public"];

function Student() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sessionId, setSessionId] = useState(
    localStorage.getItem("facechain_sessionId") || ""
  );
  const [status, setStatus] = useState("");
  const [address, setAddress] = useState("");

  const contractRef = useRef(null);
  const qrRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("sessionId");

    if (id) {
      setSessionId(id);
      localStorage.setItem("facechain_sessionId", id);
      setStatus(`Session ${id} loaded ✅`);
    }
  }, []);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setStatus("MetaMask not found ❌");
        return false;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
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

  const registerStudent = async () => {
    if (!name || !email || !address) {
      setStatus("Enter name, email and connect wallet ❌");
      return false;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          walletAddress: address,
        }),
      });

      if (!res.ok) {
        throw new Error("Registration failed");
      }

      return true;
    } catch (err) {
      console.error(err);
      setStatus("Backend registration failed ❌");
      return false;
    }
  };

  const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const toRad = (value) => (value * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const verifyLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setStatus("Geolocation not supported ❌");
        resolve(false);
        return;
      }

      setStatus("Checking location...");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          const distance = getDistanceMeters(
            latitude,
            longitude,
            CLASS_LAT,
            CLASS_LNG
          );

          if (distance <= ALLOWED_RADIUS_METERS) {
            setStatus(`Location verified ✅ (${Math.round(distance)}m away)`);
            resolve(true);
          } else {
            setStatus(`Outside allowed area ❌ (${Math.round(distance)}m away)`);
            resolve(false);
          }
        },
        (err) => {
          console.error(err);
          setStatus("Location permission denied ❌");
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const markAttendance = async () => {
    if (!sessionId) {
      setStatus("Enter or scan session ID ❌");
      return;
    }

    if (!contractRef.current) {
      const connected = await connectWallet();
      if (!connected) return;
    }

    const registered = await registerStudent();
    if (!registered) return;

    const locationOk = await verifyLocation();
    if (!locationOk) return;

    try {
      setStatus("Confirm transaction in MetaMask...");

      const tx = await contractRef.current.markAttendance(sessionId);
      await tx.wait();

      setStatus("Attendance marked successfully ✅");
    } catch (err) {
      console.error(err);
      setStatus("Transaction failed ❌ " + (err?.reason || err?.message || ""));
    }
  };

  const startQR = async () => {
    try {
      const qr = new Html5Qrcode("qr-reader");
      qrRef.current = qr;

      await qr.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: 250,
        },
        (decodedText) => {
          handleQR(decodedText);
          stopQR();
        }
      );

      setStatus("Scanning QR...");
    } catch (err) {
      console.error(err);
      setStatus("Camera error ❌");
    }
  };

  const stopQR = async () => {
    try {
      if (qrRef.current) {
        await qrRef.current.stop();
        qrRef.current.clear();
        qrRef.current = null;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleQR = (data) => {
    try {
      const url = new URL(data);
      const id = url.searchParams.get("sessionId");
      const contract = url.searchParams.get("contract");

      if (
        contract &&
        contract.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()
      ) {
        setStatus("Wrong contract QR ❌");
        return;
      }

      if (id) {
        setSessionId(id);
        localStorage.setItem("facechain_sessionId", id);
        setStatus(`Session ${id} loaded from QR ✅`);
      } else {
        setStatus("Invalid QR ❌");
      }
    } catch {
      if (/^\d+$/.test(data)) {
        setSessionId(data);
        localStorage.setItem("facechain_sessionId", data);
        setStatus(`Session ${data} loaded ✅`);
      } else {
        setStatus("Invalid QR ❌");
      }
    }
  };

  return (
    <div className="card">
      <h2>🎓 Student Dashboard</h2>

      <button onClick={connectWallet}>Connect Wallet</button>

      {address && <p className="wallet">{address}</p>}

      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        placeholder="Session ID"
        value={sessionId}
        onChange={(e) => {
          setSessionId(e.target.value);
          localStorage.setItem("facechain_sessionId", e.target.value);
        }}
      />

      <button onClick={markAttendance}>Mark Attendance</button>

      <br />

      <button className="secondary" onClick={startQR}>
        Scan QR
      </button>

      <button className="secondary" onClick={stopQR}>
        Stop QR
      </button>

      <div
        id="qr-reader"
        style={{
          width: "300px",
          marginTop: "20px",
        }}
      ></div>

      <p className="status success">{status}</p>
    </div>
  );
}

export default Student;