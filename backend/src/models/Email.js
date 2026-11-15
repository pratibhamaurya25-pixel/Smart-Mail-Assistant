import mongoose from "mongoose";

const emailSchema = new mongoose.Schema({
  senderName: {
    type: String,
    required: [true, "Sender name is required"],
    trim: true,
    maxlength: [80, "Sender name cannot exceed 80 characters"],
    index: true,
  },
  receiverName: {
    type: String,
    required: [true, "Receiver name is required"],
    trim: true,
    maxlength: [80, "Receiver name cannot exceed 80 characters"],
    index: true,
  },
  subject: {
    type: String,
    required: [true, "Subject is required"],
    trim: true,
    maxlength: [120, "Subject cannot exceed 120 characters"],
  },
  message: {
    type: String,
    required: [true, "Message is required"],
    trim: true,
    maxlength: [10000, "Message cannot exceed 10,000 characters"],
  },
}, { timestamps: true });

emailSchema.index({ receiverName: 1, createdAt: -1 });
emailSchema.index({ senderName: 1, createdAt: -1 });

const Email = mongoose.model("Email", emailSchema);

export default Email;
