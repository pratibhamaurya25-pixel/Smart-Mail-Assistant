import express from "express";
import {
  sendMessage,
  getInbox,
  getSent,
  deleteMessage,
} from "../controllers/emailController.js";

const router = express.Router();

router.post("/send", sendMessage);
router.get("/inbox", getInbox);
router.get("/sent", getSent);
router.delete("/", deleteMessage);

export default router;
