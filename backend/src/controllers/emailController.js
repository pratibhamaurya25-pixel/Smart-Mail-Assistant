import mongoose from "mongoose";
import Email from "../models/Email.js";
import asyncHandler from "../utils/asyncHandler.js";

const getName = (value) => (typeof value === "string" ? value.trim() : "");

const sendMessage = asyncHandler(async (req, res) => {
  const { senderName, receiverName, subject, message } = req.body;

  if (
    !getName(senderName) ||
    !getName(receiverName) ||
    !getName(subject) ||
    !getName(message)
  ) {
    return res.status(400).json({
      message: "Your name, receiver name, subject, and message are required",
    });
  }

  const email = await Email.create({
    senderName: getName(senderName),
    receiverName: getName(receiverName),
    subject: getName(subject),
    message: getName(message),
  });

  res.status(201).json({ email });
});

const getInbox = asyncHandler(async (req, res) => {
  const receiverName = getName(req.query.receiverName);

  if (!receiverName) {
    return res.status(400).json({ message: "Receiver name is required" });
  }

  const emails = await Email.find({ receiverName }).sort({ createdAt: -1 });
  res.status(200).json({ emails });
});

const getSent = asyncHandler(async (req, res) => {
  const senderName = getName(req.query.senderName);

  if (!senderName) {
    return res.status(400).json({ message: "Sender name is required" });
  }

  const emails = await Email.find({ senderName }).sort({ createdAt: -1 });
  res.status(200).json({ emails });
});

const deleteMessage = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "A valid message ID is required" });
  }

  const email = await Email.findByIdAndDelete(id);

  if (!email) {
    return res.status(404).json({ message: "Message was not found" });
  }

  res.status(200).json({ message: "Message deleted" });
});

export { sendMessage, getInbox, getSent, deleteMessage };
