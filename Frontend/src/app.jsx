import { useState } from "react";
import API from "./api";
import React from "react";

function App() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [wallet, setWallet] = useState("");

  const register = async () => {
    try {
      const res = await API.post("/register", {
        name,
        email,
        walletAddress: wallet,
        faceDescriptor: []
      });

      alert("Registered ✅");
      console.log(res.data);
    } catch (err) {
      console.error(err);
      alert("Error ❌");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>FaceChain 🚀</h1>

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
        placeholder="Wallet Address"
        onChange={(e) => setWallet(e.target.value)}
      />
      <br /><br />

      <button onClick={register}>Register</button>
    </div>
  );
}

export default App;