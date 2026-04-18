import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "@hirex/db";
import { signToken } from "../../utils/jwt";
import { AuthRequest } from "../../middleware/auth";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: role === "EMPLOYER" ? "EMPLOYER" : "APPLICANT",
      },
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role.toString() });

    res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
 console.log("LOGIN HIT", req.body);
    try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

   const token = signToken({ userId: user.id, email: user.email, role: user.role.toString() });

    res.status(200).json({ token, user: { id: user.id, email: user.email, role: user.role } });
 } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};