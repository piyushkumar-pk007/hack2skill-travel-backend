import bcrypt from 'bcryptjs';
import type { AuthResponse, User } from '@travel-engine/shared';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';
import { memoryStore } from '../db/memoryStore.js';
import { ServiceError } from '../lib/errors.js';

interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

function createToken(userId: string) {
  const secret = process.env.JWT_SECRET ?? 'dev-secret-not-for-production';
  return jwt.sign({ sub: userId }, secret, { expiresIn: '7d' });
}

function mapUser(record: { id: string; email: string; name: string; createdAt: Date | string; updatedAt: Date | string }): User {
  return {
    id: record.id,
    email: record.email,
    name: record.name,
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : record.createdAt.toISOString(),
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : record.updatedAt.toISOString(),
  };
}

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  const normalizedEmail = input.email.toLowerCase();

  if (!prisma) {
    const existing = memoryStore.getUserByEmail(normalizedEmail);
    if (existing) {
      throw new ServiceError('Email is already registered', 409, 'EMAIL_TAKEN');
    }

    const now = new Date().toISOString();
    const stored = memoryStore.createUser({
      id: crypto.randomUUID(),
      email: normalizedEmail,
      name: input.name,
      passwordHash: await bcrypt.hash(input.password, 10),
      createdAt: now,
      updatedAt: now,
    });

    return {
      token: createToken(stored.id),
      user: mapUser(stored),
    };
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new ServiceError('Email is already registered', 409, 'EMAIL_TAKEN');
  }

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: input.name,
      passwordHash: await bcrypt.hash(input.password, 10),
    },
  });

  return {
    token: createToken(user.id),
    user: mapUser(user),
  };
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const normalizedEmail = email.toLowerCase();

  if (!prisma) {
    const stored = memoryStore.getUserByEmail(normalizedEmail);
    if (!stored || !(await bcrypt.compare(password, stored.passwordHash))) {
      throw new ServiceError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    return {
      token: createToken(stored.id),
      user: mapUser(stored),
    };
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ServiceError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  return {
    token: createToken(user.id),
    user: mapUser(user),
  };
}

export async function getUserById(userId: string): Promise<User | null> {
  if (!prisma) {
    const user = memoryStore.getUserById(userId);
    return user ? mapUser(user) : null;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user ? mapUser(user) : null;
}
