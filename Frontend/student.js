let provider, signer, contract;
let qrScanner = null;
let qrScannerRunning = false;
let connectedStudentAddress = "";

const CONTRACT_ADDRESS = "0x71b45128128f3a1Bf554a84F0fdc8cb724B9A5d0";
const API_BASE_URL = window.FACECHAIN_CONFIG?.API_BASE_URL || "http://localhost:5000";

const ABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "sessionId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "student",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "time",
				"type": "uint256"
			}
		],
		"name": "AttendanceMarked",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "sessionId",
				"type": "uint256"
			}
		],
		"name": "closeSession",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "createSession",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "sessionId",
				"type": "uint256"
			}
		],
		"name": "markAttendance",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "sessionId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "endTime",
				"type": "uint256"
			}
		],
		"name": "SessionClosed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "sessionId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "startTime",
				"type": "uint256"
			}
		],
		"name": "SessionCreated",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "sessionId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "student",
				"type": "address"
			}
		],
		"name": "getAttendance",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "sessionId",
				"type": "uint256"
			}
		],
		"name": "getAttendees",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "sessionCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "sessions",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "sessionId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "startTime",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "endTime",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "active",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "teacher",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]

async function connectStudent() {
  const metamask = await getMetaMaskProvider();

  if (!metamask) {
    setStatus("MetaMask was not detected. On mobile, open this page inside the MetaMask app browser.", true);
    return false;
  }

  const connectButton = document.getElementById("connectWalletButton");
  connectButton.disabled = true;
  setStatus("Opening MetaMask. If no popup appears, click the MetaMask extension icon.");

  try {
    const accounts = await metamask.request({ method: "eth_requestAccounts" });

    if (!accounts.length) {
      setStatus("No MetaMask account was selected.", true);
      return false;
    }

    provider = new ethers.providers.Web3Provider(metamask);
    signer = provider.getSigner();

    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    const address = await signer.getAddress();
    connectedStudentAddress = address;
    document.getElementById("studentAddress").innerText =
      "Connected: " + shortenAddress(address);
    setStatus("Wallet connected. Ready to mark attendance.");
    return true;
  } catch (e) {
    if (e.code === 4001) {
      setStatus("MetaMask connection was rejected.", true);
    } else if (e.code === -32002) {
      setStatus("MetaMask already has a pending connection request. Open the MetaMask extension to finish it.", true);
    } else {
      setStatus("MetaMask connection failed: " + (e.message || "unknown error"), true);
    }
    return false;
  } finally {
    connectButton.disabled = false;
  }
}

async function markAttendance() {
  const sessionId = document.getElementById("sessionId").value.trim();

  if (!sessionId) {
    setStatus("Scan a QR code or enter a session ID first.", true);
    return;
  }

  if (!contract) {
    const connected = await connectStudent();
    if (!connected) return;
  }

  const registered = await registerStudent();
  if (!registered) return;

  try {
    setStatus("Confirm the MetaMask transaction to mark attendance...");
    const tx = await contract.markAttendance(sessionId);
    await tx.wait();

    setStatus("Attendance marked successfully.");
  } catch (e) {
    setStatus("Attendance failed. It may already be marked, the session may be closed, or the wallet/network may be wrong.", true);
  }
}

async function registerStudent() {
  const name = document.getElementById("studentName").value.trim();
  const email = document.getElementById("studentEmail").value.trim();

  if (!name || !email) {
    setStatus("Enter your name and email before marking attendance.", true);
    return false;
  }

  try {
    const response = await fetch(API_BASE_URL + "/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        walletAddress: connectedStudentAddress
      })
    });

    if (!response.ok) {
      throw new Error("registration failed");
    }

    return true;
  } catch (e) {
    setStatus("Could not save student details. Make sure the backend server is running on port 5000.", true);
    return false;
  }
}

async function startQrScanner() {
  if (typeof Html5Qrcode === "undefined") {
    setStatus("QR scanner library did not load. Check your internet connection.", true);
    return;
  }

  if (qrScannerRunning) return;

  const reader = document.getElementById("qrReader");
  reader.hidden = false;
  document.getElementById("scanQrButton").hidden = true;
  document.getElementById("stopQrButton").hidden = false;

  try {
    qrScanner = new Html5Qrcode("qrReader");
    const cameras = await Html5Qrcode.getCameras();
    const cameraId = cameras.length ? cameras[0].id : { facingMode: "environment" };

    await qrScanner.start(
      cameraId,
      { fps: 10, qrbox: { width: 240, height: 240 } },
      async (decodedText) => {
        const loaded = handleQrPayload(decodedText);
        await stopQrScanner();
        if (loaded) {
          await markAttendance();
        }
      }
    );

    qrScannerRunning = true;
    setStatus("Point the camera at the attendance QR code.");
  } catch (e) {
    await stopQrScanner();
    setStatus("Could not start the camera. Use HTTPS, localhost, or enter the session ID manually.", true);
  }
}

async function stopQrScanner() {
  const reader = document.getElementById("qrReader");

  if (qrScanner && qrScannerRunning) {
    await qrScanner.stop();
    qrScanner.clear();
  }

  qrScannerRunning = false;
  qrScanner = null;
  reader.hidden = true;
  document.getElementById("scanQrButton").hidden = false;
  document.getElementById("stopQrButton").hidden = true;
}

function handleQrPayload(payload) {
  try {
    const parsed = parseSessionPayload(payload);
    document.getElementById("sessionId").value = parsed.sessionId;
    setStatus("Session " + parsed.sessionId + " loaded from QR.");
    return true;
  } catch (e) {
    document.getElementById("sessionId").value = "";
    setStatus(e.message, true);
    return false;
  }
}

function parseSessionPayload(payload) {
  let sessionId = "";
  let scannedContract = "";
  const value = payload.trim();

  try {
    const url = new URL(value, window.location.href);
    sessionId = url.searchParams.get("sessionId") || "";
    scannedContract = url.searchParams.get("contract") || "";
  } catch (e) {
    // Not a URL, try JSON or a plain numeric session id below.
  }

  if (!sessionId) {
    try {
      const data = JSON.parse(value);
      sessionId = String(data.sessionId || "");
      scannedContract = data.contract || "";
    } catch (e) {
      sessionId = value;
    }
  }

  if (scannedContract && scannedContract.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
    throw new Error("This QR code belongs to a different attendance contract.");
  }

  if (!/^\d+$/.test(sessionId)) {
    throw new Error("Invalid attendance QR code.");
  }

  return { sessionId };
}

function setStatus(message, isError = false) {
  const status = document.getElementById("status");
  status.innerText = message;
  status.style.color = isError ? "crimson" : "green";
}

function shortenAddress(address) {
  return address.slice(0, 6) + "..." + address.slice(-4);
}

async function getMetaMaskProvider() {
  if (!window.ethereum) {
    await waitForEthereum();
  }

  if (!window.ethereum) return null;

  if (window.ethereum.providers) {
    return window.ethereum.providers.find((provider) => provider.isMetaMask) || null;
  }

  return window.ethereum.isMetaMask ? window.ethereum : window.ethereum;
}

function waitForEthereum() {
  return new Promise((resolve) => {
    window.addEventListener("ethereum#initialized", resolve, { once: true });
    setTimeout(resolve, 1500);
  });
}

window.addEventListener("load", () => {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("sessionId");

  if (sessionId) {
    handleQrPayload(window.location.href);
  }
});
