let provider, signer, contract;
let currentSessionId = null;

const CONTRACT_ADDRESS = "0x71b45128128f3a1Bf554a84F0fdc8cb724B9A5d0";
const API_BASE_URL = window.FACECHAIN_CONFIG?.API_BASE_URL || "http://localhost:5000";
const FRONTEND_BASE_URL = window.FACECHAIN_CONFIG?.FRONTEND_BASE_URL || window.location.href.replace(/[^/]*$/, "");

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

async function connectTeacher() {
  const metamask = await getMetaMaskProvider();

  if (!metamask) {
    setStatus("MetaMask was not detected in this browser. Open this page in the browser where MetaMask is installed.", true);
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
    document.getElementById("teacherAddress").innerText =
      "Connected: " + shortenAddress(address);
    setStatus("Wallet connected. Create a session to generate the student QR code.");
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

async function createSession() {
  if (!contract) {
    const connected = await connectTeacher();
    if (!connected) return;
  }

  const createButton = document.getElementById("createSessionButton");
  createButton.disabled = true;

  try {
    setStatus("Confirm the MetaMask transaction to create an attendance session...");
    const tx = await contract.createSession();
    const receipt = await tx.wait();

    const event = receipt.events.find(e => e.event === "SessionCreated");
    currentSessionId = event.args.sessionId.toNumber();

    document.getElementById("sessionInfo").innerText =
      "Session ID: " + currentSessionId;

    const qrData = new URL("student.html", FRONTEND_BASE_URL);
    qrData.searchParams.set("contract", CONTRACT_ADDRESS);
    qrData.searchParams.set("sessionId", currentSessionId);

    await QRCode.toCanvas(
      document.getElementById("qr"),
      qrData.toString(),
      { width: 280, margin: 2 }
    );

    const qrLink = document.getElementById("qrLink");
    qrLink.href = qrData.toString();
    qrLink.hidden = false;
    qrLink.innerText = "Open student attendance link for session " + currentSessionId;

    setStatus("Session created. Students can scan the QR code, connect MetaMask, and confirm attendance.");
    await loadAttendees();
  } catch (e) {
    setStatus("Session creation failed: " + (e.message || "unknown error"), true);
  } finally {
    createButton.disabled = false;
  }
}

async function closeSession() {
  if (currentSessionId === null) {
    setStatus("Create a session before closing attendance.", true);
    return;
  }

  if (!contract) {
    const connected = await connectTeacher();
    if (!connected) return;
  }

  const closeButton = document.getElementById("closeSessionButton");
  closeButton.disabled = true;

  try {
    setStatus("Confirm the MetaMask transaction to close this session...");
    const tx = await contract.closeSession(currentSessionId);
    await tx.wait();
    setStatus("Session " + currentSessionId + " closed.");
  } catch (e) {
    setStatus("Closing session failed: " + (e.message || "unknown error"), true);
  } finally {
    closeButton.disabled = false;
  }
}

async function loadAttendees() {
  if (currentSessionId === null) {
    setStatus("Create a session before loading attendees.", true);
    return;
  }

  if (!contract) {
    const connected = await connectTeacher();
    if (!connected) return;
  }

  try {
    const attendees = await contract.getAttendees(currentSessionId);
    const studentsByWallet = await loadStudentsByWallet(attendees);
    const ul = document.getElementById("attendees");
    ul.innerHTML = "";

    attendees.forEach(addr => {
      const student = studentsByWallet[addr.toLowerCase()];
      const li = document.createElement("li");
      li.innerText = student
        ? student.name + " (" + student.email + ") - " + addr
        : "Unregistered student - " + addr;
      ul.appendChild(li);
    });

    setStatus("Loaded " + attendees.length + " attendee(s) for session " + currentSessionId + ".");
  } catch (e) {
    setStatus("Could not load attendees: " + (e.message || "unknown error"), true);
  }
}

async function loadStudentsByWallet(wallets) {
  if (!wallets.length) return {};

  try {
    const response = await fetch(
      API_BASE_URL + "/students/by-wallets?addresses=" + encodeURIComponent(wallets.join(","))
    );

    if (!response.ok) {
      throw new Error("student lookup failed");
    }

    const students = await response.json();

    return students.reduce((byWallet, student) => {
      byWallet[String(student.walletAddress).toLowerCase()] = student;
      return byWallet;
    }, {});
  } catch (e) {
    setStatus("Attendees loaded from blockchain, but student names could not be loaded from the backend.", true);
    return {};
  }
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
