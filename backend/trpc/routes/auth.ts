import { TRPCError } from '@trpc/server';
import * as z from 'zod';
import { db } from '../../db/database';
import {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/auth';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../create-context';

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      console.log('Login attempt:', input.email);
      
      const user = await db.getUserByEmail(input.email);
      
      if (!user) {
        console.log('User not found:', input.email);
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      const isValidPassword = await comparePassword(input.password, user.password);
      
      if (!isValidPassword) {
        console.log('Invalid password for:', input.email);
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      await db.saveRefreshToken(refreshToken, user.id, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

      console.log('Login successful:', user.email);

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    }),

  refresh: publicProcedure
    .input(
      z.object({
        refreshToken: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const payload = verifyRefreshToken(input.refreshToken);
        
        const storedToken = await db.getRefreshToken(input.refreshToken);
        if (!storedToken) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid refresh token',
          });
        }

        if (storedToken.expiresAt < new Date()) {
          await db.deleteRefreshToken(input.refreshToken);
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Refresh token expired',
          });
        }

        const user = await db.getUserById(payload.userId);
        if (!user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not found',
          });
        }

        const newPayload = {
          userId: user.id,
          email: user.email,
          role: user.role,
        };

        const accessToken = generateAccessToken(newPayload);

        return {
          accessToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        };
      } catch {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid refresh token',
        });
      }
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.getUserById(ctx.user.userId);
    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }),

  logout: protectedProcedure
    .input(
      z.object({
        refreshToken: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await db.deleteRefreshToken(input.refreshToken);
      return { success: true };
    }),
});
