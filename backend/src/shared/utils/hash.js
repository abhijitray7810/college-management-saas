import bcrypt from 'bcrypt';
import { env } from '../../config/env.js';

const SALT_ROUNDS = env.BCRYPT_SALT_ROUNDS;

export const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};
