import { DEFAULT_ROLE, ROLES } from '../../shared/constants/roles.js';
import { hashPassword, comparePassword } from '../../shared/utils/hash.js';
import { generateToken } from '../../shared/utils/token.js';
import { authRepository } from './auth.repository.js';
import { AppError } from '../../shared/middleware/error.middleware.js';

export const authService = {
  async register(registerData) {
    const { name, email, password, role } = registerData;

    const emailExists = await authRepository.emailExists(email);
    if (emailExists) {
      throw new AppError('Email already registered', 409);
    }

    const passwordHash = await hashPassword(password);

    const userRole = role || DEFAULT_ROLE;

    const user = await authRepository.create({
      name,
      email,
      passwordHash,
      role: userRole,
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user,
      token,
    };
  },

  async login(loginData) {
    const { email, password } = loginData;

    const user = await authRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  },

  async getCurrentUser(userId) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  },
};
