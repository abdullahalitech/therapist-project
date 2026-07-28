import { Router } from "express";
import rateLimit from "express-rate-limit";
import { contactSchema } from "@therapist/shared";
import { FAQ } from "../models/FAQ";
import { ContactMessage } from "../models/ContactMessage";
import { validateBody } from "../middleware/validate";

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many contact submissions, please try again later" },
});

router.get("/faqs", async (_req, res) => {
  const faqs = await FAQ.find({ isPublished: true }).sort({ order: 1 });
  res.json(
    faqs.map((f) => ({
      id: f._id.toString(),
      question: f.question,
      answer: f.answer,
      order: f.order,
    }))
  );
});

router.post(
  "/contact",
  contactLimiter,
  validateBody(contactSchema),
  async (req, res) => {
    await ContactMessage.create(req.body);
    res.status(201).json({ message: "Message sent successfully" });
  }
);

export default router;
