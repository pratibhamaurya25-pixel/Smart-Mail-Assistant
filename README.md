# Smart Mail Assistant

A small React and Express project for sending and browsing messages by name. Messages are stored in MongoDB. This project does not have login accounts and does not send real email.

## Requirements

- Node.js and npm
- MongoDB running locally, or a MongoDB Atlas connection string

## Configure and run the backend

In a terminal, open the backend folder and install its packages:

```bash
cd backend
npm install
```

Create a local `.env` file from the example:

```bash
cp .env.example .env
```

The example connects to a local MongoDB server. If using MongoDB Atlas, replace `MONGODB_URI` in `backend/.env` with your own connection string.

Start the backend:

```bash
npm run dev
```

The API listens on `http://localhost:5000`. Check that it is running with:

```bash
curl http://localhost:5000/api/health
```

## Run the frontend

Open a second terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## How it works

Enter your name at the top of the dashboard to open your inbox. Messages are addressed using names rather than accounts. The app remembers your name in this browser. To send a message, enter the receiver's name, a subject, and a message. The receiver can see it by opening the app and entering the same name.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Check whether the backend is running |
| `POST` | `/api/emails/send` | Save a message with sender and receiver names |
| `GET` | `/api/emails/inbox?receiverName=Sam` | List messages addressed to a name |
| `GET` | `/api/emails/sent?senderName=Sam` | List messages sent by a name |
| `DELETE` | `/api/emails/` | Delete one message by sending `{ "id": "message-id" }` in the request body |

No SMTP, Gmail, or Nodemailer is used.
