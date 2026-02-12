import argon2 from "argon2";

import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiryDate,
} from "../auth/tokens.js";

import { prisma } from "../prisma.js";

const userInclude = {
  profile: true,
  companies: {
    include: {
      company: true,
      user: true,
    },
  },
};

const companyInclude = {
  members: {
    include: {
      company: true,
      user: true,
    },
  },
};

const memberInclude = {
  company: true,
  user: true,
};

const requireUserId = (context) => {
  if (!context.userId) throw new Error("Unauthorized.");
  return context.userId;
};

const ensureCompanyOwner = async (companyId, userId) => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true },
  });
  if (!company) throw new Error("Company not found.");

  const membership = await prisma.member.findUnique({
    where: {
      companyId_userId: {
        companyId,
        userId,
      },
    },
    select: { role: true },
  });

  if (!membership) throw new Error("You are not a member of this company.");
  if (membership.role !== "OWNER") {
    throw new Error("Only company owners can perform this action.");
  }
};


export const resolvers = {
  Query: {
    me: async (_parent, _args, context) => {
      const { userId } = context;
      if (!userId) return null;

      return prisma.user.findUnique({
        where: { id: userId },
        include: userInclude,
      });
    },

    user: async (_parent, args) => {
      return prisma.user.findUnique({
        where: { id: args.id },
        include: userInclude,
      });
    },

    profileByUsername: async (_parent, args) => {
      return prisma.profile.findUnique({
        where: { username: args.username },
      });
    },

    users: async () => {
      return prisma.user.findMany({
        include: userInclude,
      });
    },

    company: async (_parent, args) => {
      return prisma.company.findUnique({
        where: { id: args.id },
        include: companyInclude,
      });
    },

    companyMembers: async (_parent, args, context) => {
      const actorUserId = requireUserId(context);

      const actorMembership = await prisma.member.findUnique({
        where: {
          companyId_userId: {
            companyId: args.companyId,
            userId: actorUserId,
          },
        },
        select: { id: true },
      });

      if (!actorMembership) throw new Error("Forbidden.");

      return prisma.member.findMany({
        where: { companyId: args.companyId },
        include: memberInclude,
      });
    },

    companies: async () => {
      return prisma.company.findMany({
        include: companyInclude,
      });
    },

    myCompanies: async (_parent, _args, context) => {
      const { userId } = context;
      if (!userId) return [];

      const memberships = await prisma.member.findMany({
        where: { userId },
        include: {
          company: {
            include: companyInclude,
          },
        },
      });

      return memberships.map((membership) => membership.company);
    },

    members: async () => {
      return prisma.member.findMany({
        include: memberInclude,
      });
    },
  },

  Mutation: {
    register: async (_parent, args) => {
      const { email, password } = args;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) throw new Error("Email already in use.");

      const passwordHash = await argon2.hash(password);

      const user = await prisma.user.create({
        data: { email, passwordHash },
        include: userInclude,
      });

      const accessToken = signAccessToken({ userId: user.id });

      const rawRefresh = generateRefreshToken();
      const tokenHash = hashRefreshToken(rawRefresh);

      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: refreshTokenExpiryDate(),
        },
      });

      return { accessToken, refreshToken: rawRefresh, user };
    },

    deleteUser: async (_parent, args, context) => {
      const userId = requireUserId(context);
      if (userId !== args.id) throw new Error("Forbidden.");

      await prisma.$transaction(async (tx) => {
        await tx.refreshToken.deleteMany({ where: { userId } });
        await tx.member.deleteMany({ where: { userId } });
        await tx.profile.deleteMany({ where: { userId } });
        await tx.user.delete({ where: { id: userId } });
      });

      return true;
    },

    createProfile: async (_parent, args, context) => {
      const userId = requireUserId(context);

      const existingProfile = await prisma.profile.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (existingProfile) throw new Error("Profile already exists.");

      const { firstName, lastName, username, zipcode, avatarUrl } = args;

      try {
        return await prisma.profile.create({
          data: {
            userId,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            username: username.trim(),
            zipcode: zipcode.trim(),
            avatarUrl: avatarUrl?.trim() || null,
          },
        });
      } catch (error) {
        if (error?.code === "P2002") {
          throw new Error("Username already in use.");
        }
        throw error;
      }
    },

    updateProfile: async (_parent, args, context) => {
      const userId = requireUserId(context);

      const existingProfile = await prisma.profile.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!existingProfile) throw new Error("Profile not found.");

      const data = {};
      if (args.firstName !== undefined) data.firstName = args.firstName.trim();
      if (args.lastName !== undefined) data.lastName = args.lastName.trim();
      if (args.username !== undefined) data.username = args.username.trim();
      if (args.zipcode !== undefined) data.zipcode = args.zipcode.trim();
      if (args.avatarUrl !== undefined) data.avatarUrl = args.avatarUrl.trim() || null;

      if (Object.keys(data).length === 0) {
        throw new Error("No profile fields provided.");
      }

      try {
        return await prisma.profile.update({
          where: { userId },
          data,
        });
      } catch (error) {
        if (error?.code === "P2002") {
          throw new Error("Username already in use.");
        }
        throw error;
      }
    },

    deleteProfile: async (_parent, _args, context) => {
      const userId = requireUserId(context);
      const result = await prisma.profile.deleteMany({ where: { userId } });
      return result.count > 0;
    },

    createCompany: async (_parent, args, context) => {
      const userId = requireUserId(context);

      const { name, logoUrl } = args;

      try {
        return await prisma.$transaction(async (tx) => {
          const company = await tx.company.create({
            data: {
              name: name.trim(),
              logoUrl: logoUrl?.trim() || null,
            },
          });

          await tx.member.create({
            data: {
              companyId: company.id,
              userId,
              role: "OWNER",
            },
          });

          return tx.company.findUnique({
            where: { id: company.id },
            include: companyInclude,
          });
        });
      } catch (error) {
        if (error?.code === "P2002") {
          throw new Error("Company name already in use.");
        }
        throw error;
      }
    },

    updateCompany: async (_parent, args, context) => {
      const actorUserId = requireUserId(context);
      const { companyId } = args;

      await ensureCompanyOwner(companyId, actorUserId);

      const data = {};
      if (args.name !== undefined) data.name = args.name.trim();
      if (args.logoUrl !== undefined) data.logoUrl = args.logoUrl.trim() || null;

      if (Object.keys(data).length === 0) {
        throw new Error("No company fields provided.");
      }

      try {
        return await prisma.company.update({
          where: { id: companyId },
          data,
          include: companyInclude,
        });
      } catch (error) {
        if (error?.code === "P2002") {
          throw new Error("Company name already in use.");
        }
        if (error?.code === "P2025") {
          throw new Error("Company not found.");
        }
        throw error;
      }
    },

    deleteCompany: async (_parent, args, context) => {
      const actorUserId = requireUserId(context);
      const { companyId } = args;

      const existingCompany = await prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true },
      });
      if (!existingCompany) throw new Error("Company not found.");

      await ensureCompanyOwner(companyId, actorUserId);

      await prisma.$transaction(async (tx) => {
        await tx.member.deleteMany({ where: { companyId } });
        await tx.company.delete({ where: { id: companyId } });
      });

      return true;
    },

    addCompanyMember: async (_parent, args, context) => {
      const actorUserId = requireUserId(context);

      const { companyId, userId, role } = args;

      await ensureCompanyOwner(companyId, actorUserId);

      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (!existingUser) throw new Error("User not found.");

      try {
        return await prisma.member.create({
          data: { companyId, userId, role },
          include: memberInclude,
        });
      } catch (error) {
        if (error?.code === "P2002") {
          throw new Error("User is already a member of this company.");
        }
        if (error?.code === "P2003") {
          throw new Error("Company not found.");
        }
        throw error;
      }
    },

    updateCompanyMemberRole: async (_parent, args, context) => {
      const actorUserId = requireUserId(context);
      const { companyId, userId, role } = args;

      await ensureCompanyOwner(companyId, actorUserId);

      const existingMembership = await prisma.member.findUnique({
        where: {
          companyId_userId: {
            companyId,
            userId,
          },
        },
        select: { role: true },
      });
      if (!existingMembership) throw new Error("Member not found.");

      return prisma.member.update({
        where: {
          companyId_userId: {
            companyId,
            userId,
          },
        },
        data: { role },
        include: memberInclude,
      });
    },

    removeCompanyMember: async (_parent, args, context) => {
      const actorUserId = requireUserId(context);
      const { companyId, userId } = args;

      await ensureCompanyOwner(companyId, actorUserId);
      if (actorUserId === userId) {
        throw new Error("Use leaveCompany to remove yourself.");
      }

      const membership = await prisma.member.findUnique({
        where: {
          companyId_userId: {
            companyId,
            userId,
          },
        },
        select: { role: true },
      });
      if (!membership) throw new Error("Member not found.");

      if (membership.role === "OWNER") {
        const ownerCount = await prisma.member.count({
          where: { companyId, role: "OWNER" },
        });
        if (ownerCount <= 1) {
          throw new Error("Cannot remove the only owner.");
        }
      }

      await prisma.member.delete({
        where: {
          companyId_userId: {
            companyId,
            userId,
          },
        },
      });

      return true;
    },

    leaveCompany: async (_parent, args, context) => {
      const userId = requireUserId(context);
      const { companyId } = args;

      const membership = await prisma.member.findUnique({
        where: {
          companyId_userId: {
            companyId,
            userId,
          },
        },
        select: { role: true },
      });
      if (!membership) throw new Error("Not a company member.");

      if (membership.role === "OWNER") {
        const ownerCount = await prisma.member.count({
          where: { companyId, role: "OWNER" },
        });
        if (ownerCount <= 1) {
          throw new Error("Cannot leave company as the only owner.");
        }
      }

      await prisma.member.delete({
        where: {
          companyId_userId: {
            companyId,
            userId,
          },
        },
      });

      return true;
    },

    login: async (_parent, args) => {
      const { email, password } = args;

      const user = await prisma.user.findUnique({
        where: { email },
        include: userInclude,
      });

      if (!user) throw new Error("Invalid email or password.");

      const ok = await argon2.verify(user.passwordHash, password);
      if (!ok) throw new Error("Invalid email or password.");

      const accessToken = signAccessToken({ userId: user.id });

      const rawRefresh = generateRefreshToken();
      const tokenHash = hashRefreshToken(rawRefresh);

      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: refreshTokenExpiryDate(),
        },
      });

      return { accessToken, refreshToken: rawRefresh, user };
    },

    refreshToken: async (_parent, args) => {
      const tokenHash = hashRefreshToken(args.refreshToken);

      const existing = await prisma.refreshToken.findUnique({
        where: { tokenHash },
      });

      if (!existing) throw new Error("Invalid refresh token.");
      if (existing.revokedAt) throw new Error("Refresh token revoked.");
      if (existing.expiresAt <= new Date()) throw new Error("Refresh token expired.");

      const newRaw = generateRefreshToken();
      const newHash = hashRefreshToken(newRaw);

      const result = await prisma.$transaction(async (tx) => {
        const newRow = await tx.refreshToken.create({
          data: {
            userId: existing.userId,
            tokenHash: newHash,
            expiresAt: refreshTokenExpiryDate(),
          },
        });

        await tx.refreshToken.update({
          where: { id: existing.id },
          data: {
            revokedAt: new Date(),
            replacedByTokenId: newRow.id,
          },
        });

        const user = await tx.user.findUnique({
          where: { id: existing.userId },
          include: userInclude,
        });

        return { user };
      });

      const accessToken = signAccessToken({ userId: existing.userId });

      return {
        accessToken,
        refreshToken: newRaw,
        user: result.user,
      };
    },

    logout: async (_parent, _args, context) => {
      const raw = context.refreshToken;
      if (!raw) return true;

      const tokenHash = hashRefreshToken(raw);

      await prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      return true;
    },
  },
};
