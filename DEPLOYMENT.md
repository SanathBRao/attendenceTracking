# FaceChain Attendance Deployment

Deploy two pieces:

1. `Backend` as a Node/Express API.
2. `Frontend` as a static site.

Both should use HTTPS for mobile camera and MetaMask mobile browser support.

## Backend

Set these environment variables on your backend host:

```env
MONGO_URI=your_mongodb_connection_string
FRONTEND_ORIGIN=https://your-frontend-domain.com
PORT=5000
```

Start command:

```bash
npm start
```

After deployment, test:

```text
https://your-backend-domain.com/
```

It should respond with `FaceChain Backend Running`.

## Frontend

Before deploying the static frontend, update `Frontend/config.js`:

```js
window.FACECHAIN_CONFIG = {
  API_BASE_URL: "https://your-backend-domain.com",
  FRONTEND_BASE_URL: window.location.origin + window.location.pathname.replace(/[^/]*$/, "")
};
```

Deploy the `Frontend` folder as a static site.

Open:

```text
https://your-frontend-domain.com/teacher.html
https://your-frontend-domain.com/student.html
```

## Mobile Use

Students should open the attendance link inside the MetaMask mobile app browser, because normal mobile browsers usually do not inject `window.ethereum`.

Flow:

1. Teacher opens `teacher.html`.
2. Teacher connects MetaMask on Sepolia.
3. Teacher creates a session and confirms the transaction.
4. Teacher shows the QR code.
5. Student scans/opens the QR link in MetaMask mobile browser.
6. Student enters name/email, connects wallet, and confirms attendance.
7. Teacher clicks `Refresh Attendees`.
