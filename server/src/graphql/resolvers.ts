import argon2 from "argon2";
import { GraphQLScalarType, Kind } from "graphql";
import type { AppContext } from "./context.js";

import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiryDate,
} from "../auth/tokens.js";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
  passwordResetTokenExpiryDate,
} from "../auth/passwordReset.js";
import {
  buildPasswordResetUrl,
  sendPasswordResetEmail,
} from "../email/mailer.js";

import { prisma } from "../prisma.js";

// Include maps replaced by field resolvers — passing undefined to Prisma's
// include option is a no-op (returns only scalar fields). Relations are loaded
// on-demand by the type field resolvers below using DataLoaders.
const userInclude = undefined;
const profileInclude = undefined;
const companyInclude = undefined;
const memberInclude = undefined;
const membershipRequestInclude = undefined;
const gigInclude = undefined;
const assignmentInclude = undefined;
const assignmentForReviewInclude = undefined;
const reviewInclude = undefined;
const starsTransactionInclude = undefined;
const moneyTransactionInclude = undefined;
const productInclude = undefined;
const purchaseInclude = undefined;
const watchlistInclude = undefined;

// Only the gig read queries include _count so watchlistCount can be resolved
// without an extra round-trip per gig.
const gigCountInclude = { _count: { select: { watchlistEntries: true } } };

// ── Input validators ─────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SPECIAL_CHAR_RE = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/;

function validateEmail(email) {
  if (!email || !EMAIL_RE.test(email.trim())) {
    throw new Error("Invalid email address.");
  }
}

function validatePassword(password) {
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  if (!SPECIAL_CHAR_RE.test(password)) {
    throw new Error("Password must contain at least one special character.");
  }
}

// ─────────────────────────────────────────────────────────────────────────────

const normalizePagination = (limit, offset) => {
  const take =
    typeof limit === "number" ? Math.max(1, Math.min(limit, 100)) : undefined;
  const skip = typeof offset === "number" ? Math.max(0, offset) : undefined;
  return { take, skip };
};

const normalizeImageUrls = (urls) => {
  if (!Array.isArray(urls)) return [];
  return urls
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
};

// Central auth guard for resolvers that require a logged-in user.
const requireUserId = (context: AppContext): string => {
  if (!context.userId) throw new Error("Unauthorized.");
  return context.userId;
};

// Some financial resolvers operate on Profile IDs, not User IDs.
const requireProfileId = async (context: AppContext): Promise<string> => {
  const userId = requireUserId(context);
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error("Profile not found.");
  return profile.id;
};

// Guard for admin-only resolvers. Checks the DB so role changes take effect immediately.
const requireAdminRole = async (context: AppContext): Promise<string> => {
  const userId = requireUserId(context);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || user.role !== "ADMIN") throw new Error("Forbidden.");
  return userId;
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

const ensureCompanyRole = async (companyId, userId, allowedRoles) => {
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
  if (!allowedRoles.includes(membership.role)) throw new Error("Forbidden.");
};

// Dynamic pricing/stars are computed on read; no cron/job mutates Gig price over time.
const PRICE_BUMP_ACTIVE_STATUSES = new Set(["DRAFT", "OPEN"]);
const TIER_ORDER = ["COPPER", "BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"];
const TIER_THRESHOLDS = [
  { minimumFiveStarCompletions: 500, tier: "DIAMOND" },
  { minimumFiveStarCompletions: 250, tier: "PLATINUM" },
  { minimumFiveStarCompletions: 100, tier: "GOLD" },
  { minimumFiveStarCompletions: 25, tier: "SILVER" },
  { minimumFiveStarCompletions: 10, tier: "BRONZE" },
];

const coerceNonNegativeInt = (value, fallback = 0) => {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value));
};

const getBumpWindowEndTime = (gig, now) => {
  // Price/stars increase only while the gig is still available/open.
  const statusEnd = PRICE_BUMP_ACTIVE_STATUSES.has(gig.status)
    ? now
    : (gig.updatedAt ? new Date(gig.updatedAt) : now);
  // Optional scheduling cap: stop bumping at endsAt even if status was not transitioned.
  const expiresAt = gig.endsAt ? new Date(gig.endsAt) : null;
  if (!expiresAt) return statusEnd;
  return expiresAt < statusEnd ? expiresAt : statusEnd;
};

const computeElapsedSeconds = (gig, now = new Date()) => {
  const createdAt = gig.createdAt ? new Date(gig.createdAt) : now;
  const endAt = getBumpWindowEndTime(gig, now);
  const elapsedMs = Math.max(0, endAt.getTime() - createdAt.getTime());
  return Math.floor(elapsedMs / 1000);
};

const computePriceBumps = (gig, now = new Date()) => {
  const everySeconds = coerceNonNegativeInt(gig.bumpEverySeconds, 1800);
  if (everySeconds <= 0) return 0;
  const elapsedSeconds = computeElapsedSeconds(gig, now);
  let bumps = Math.floor(elapsedSeconds / everySeconds);

  if (gig.maxBumps !== null && gig.maxBumps !== undefined) {
    bumps = Math.min(bumps, coerceNonNegativeInt(gig.maxBumps));
  }

  return Math.max(0, bumps);
};

const computeCurrentPriceCents = (gig, now = new Date()) => {
  const base = coerceNonNegativeInt(gig.basePriceCents ?? gig.payCents, 0);
  const bumpCents = coerceNonNegativeInt(gig.bumpCents, 100);
  let current = base + computePriceBumps(gig, now) * bumpCents;

  if (gig.maxPriceCents !== null && gig.maxPriceCents !== undefined) {
    current = Math.min(current, coerceNonNegativeInt(gig.maxPriceCents));
  }

  return current;
};

const computeAgeBonusStars = (gig, now = new Date()) => {
  const everySeconds = coerceNonNegativeInt(gig.starsBumpEverySeconds, 1800);
  if (everySeconds <= 0) return 0;

  const elapsedSeconds = computeElapsedSeconds(gig, now);
  let ageBonus = Math.floor(elapsedSeconds / everySeconds) * coerceNonNegativeInt(gig.starsBumpAmount, 1);

  if (gig.maxAgeBonusStars !== null && gig.maxAgeBonusStars !== undefined) {
    ageBonus = Math.min(ageBonus, coerceNonNegativeInt(gig.maxAgeBonusStars));
  }

  return Math.max(0, ageBonus);
};

const computeRepostBonusStars = (gig) => {
  const repostCount = coerceNonNegativeInt(gig.repostCount, 0);
  const perRepost = coerceNonNegativeInt(gig.repostBonusPerRepost, 1);
  return repostCount * perRepost;
};

const computeTotalStarsReward = (gig) =>
  coerceNonNegativeInt(gig.baseStars, 0) + computeAgeBonusStars(gig) + computeRepostBonusStars(gig);

const getTierRank = (tier) => TIER_ORDER.indexOf(tier);

const tierFromFiveStarCompletionCount = (count) => {
  for (const rule of TIER_THRESHOLDS) {
    if (count >= rule.minimumFiveStarCompletions) return rule.tier;
  }
  return "COPPER";
};

const maybeUpgradeTierFromFiveStarCompletions = async (tx, assigneeUserId) => {
  const profile = await tx.profile.findUnique({
    where: { userId: assigneeUserId },
    select: { id: true, tier: true },
  });
  if (!profile) return null;

  const fiveStarCompletionCount = await tx.gigReview.count({
    where: {
      decision: "APPROVED",
      starsRating: 5,
      assignment: {
        userId: assigneeUserId,
      },
    },
  });

  const earnedTier = tierFromFiveStarCompletionCount(fiveStarCompletionCount);
  if (getTierRank(earnedTier) <= getTierRank(profile.tier)) {
    return null;
  }

  return tx.profile.update({
    where: { id: profile.id },
    data: { tier: earnedTier },
    select: { id: true, tier: true },
  });
};

const gigPayoutSelect = {
  id: true,
  companyId: true,
  status: true,
  payCents: true,
  basePriceCents: true,
  bumpEverySeconds: true,
  bumpCents: true,
  maxBumps: true,
  maxPriceCents: true,
  baseStars: true,
  starsBumpEverySeconds: true,
  starsBumpAmount: true,
  maxAgeBonusStars: true,
  repostCount: true,
  repostBonusPerRepost: true,
  createdAt: true,
  updatedAt: true,
  endsAt: true,
};

const createPayoutForCompletedAssignment = async (tx, { assignmentId, assigneeUserId, gig }) => {
  const payoutCents = computeCurrentPriceCents(gig);
  if (payoutCents <= 0) return null;

  const existingPayout = await tx.moneyTransaction.findFirst({
    where: {
      assignmentId,
      reason: "PAYOUT",
    },
    select: { id: true },
  });
  if (existingPayout) return null;

  const assigneeProfile = await tx.profile.findUnique({
    where: { userId: assigneeUserId },
    select: { id: true },
  });
  if (!assigneeProfile) {
    throw new Error("Profile not found for assignment assignee.");
  }

  return tx.moneyTransaction.create({
    data: {
      contractorId: assigneeProfile.id,
      amountCents: payoutCents,
      reason: "PAYOUT",
      gigId: gig.id,
      assignmentId,
    },
    include: moneyTransactionInclude,
  });
};

const createStarsRewardForCompletedAssignment = async (tx, { assignmentId, assigneeUserId, gig }) => {
  const starsDelta = computeTotalStarsReward(gig);
  if (starsDelta <= 0) return null;

  const existingStarsReward = await tx.starsTransaction.findFirst({
    where: {
      assignmentId,
      reason: "EARNED_FROM_REVIEW",
    },
    select: { id: true },
  });
  if (existingStarsReward) return null;

  const assigneeProfile = await tx.profile.findUnique({
    where: { userId: assigneeUserId },
    select: { id: true },
  });
  if (!assigneeProfile) {
    throw new Error("Profile not found for assignment assignee.");
  }

  const starsTransaction = await tx.starsTransaction.create({
    data: {
      contractorId: assigneeProfile.id,
      delta: starsDelta,
      reason: "EARNED_FROM_REVIEW",
      gigId: gig.id,
      assignmentId,
    },
    include: starsTransactionInclude,
  });

  await tx.profile.update({
    where: { id: assigneeProfile.id },
    data: {
      starsBalance: {
        increment: starsDelta,
      },
    },
  });

  return starsTransaction;
};


const DateTimeScalar = new GraphQLScalarType({
  name: "DateTime",
  description: "ISO-8601 date-time string, serialized from/parsed to JavaScript Date.",
  serialize(value) {
    if (value instanceof Date) return value.toISOString();
    return String(value);
  },
  parseValue(value: unknown) {
    const date = new Date(value as string | number | Date);
    if (isNaN(date.getTime())) throw new Error(`Invalid DateTime value: ${String(value)}`);
    return date;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      const date = new Date(ast.value);
      if (isNaN(date.getTime())) throw new Error(`Invalid DateTime literal: ${ast.value}`);
      return date;
    }
    throw new Error("DateTime must be a string literal.");
  },
});

export const resolvers = {
  DateTime: DateTimeScalar,

  Query: {
    me: async (_parent, _args, context) => {
      const { userId } = context;
      if (!userId) return null;

      return prisma.user.findUnique({
        where: { id: userId },
        include: userInclude,
      });
    },

    user: async (_parent, args, context) => {
      const actorUserId = requireUserId(context);
      if (args.id !== actorUserId) {
        const sharedMembership = await prisma.member.findFirst({
          where: {
            userId: actorUserId,
            company: {
              members: {
                some: { userId: args.id },
              },
            },
          },
          select: { id: true },
        });
        if (!sharedMembership) throw new Error("Forbidden.");
      }

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

    users: async (_parent, args, context) => {
      await requireAdminRole(context);
      const { take, skip } = normalizePagination(args.limit, args.offset);
      return prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take,
        skip,
      });
    },

    company: async (_parent, args, context) => {
      const actorUserId = requireUserId(context);
      const membership = await prisma.member.findUnique({
        where: {
          companyId_userId: {
            companyId: args.id,
            userId: actorUserId,
          },
        },
        select: { id: true },
      });
      if (!membership) throw new Error("Forbidden.");

      return prisma.company.findUnique({
        where: { id: args.id },
        include: companyInclude,
      });
    },

    companyDirectory: async (_parent, args, context) => {
      requireUserId(context);
      const { take, skip } = normalizePagination(args.limit, args.offset);
      const search = args.search?.trim();

      return prisma.company.findMany({
        where: search
          ? {
              name: {
                contains: search,
                mode: "insensitive",
              },
            }
          : undefined,
        include: companyInclude,
        orderBy: { name: "asc" },
        take,
        skip,
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

    companyMembershipRequests: async (_parent, args, context) => {
      const actorUserId = requireUserId(context);
      await ensureCompanyOwner(args.companyId, actorUserId);
      const { take, skip } = normalizePagination(args.limit, args.offset);

      return prisma.companyMembershipRequest.findMany({
        where: {
          companyId: args.companyId,
          ...(args.status ? { status: args.status } : {}),
        },
        include: membershipRequestInclude,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      });
    },

    myCompanyMembershipRequests: async (_parent, args, context) => {
      const actorUserId = requireUserId(context);
      const { take, skip } = normalizePagination(args.limit, args.offset);

      return prisma.companyMembershipRequest.findMany({
        where: {
          userId: actorUserId,
          ...(args.status ? { status: args.status } : {}),
        },
        include: membershipRequestInclude,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      });
    },

    location: async (_parent, args, context) => {
      requireUserId(context);
      return prisma.location.findUnique({
        where: { id: args.id },
      });
    },

    locations: async (_parent, args, context) => {
      requireUserId(context);
      const { take, skip } = normalizePagination(args.limit, args.offset);
      return prisma.location.findMany({
        orderBy: { createdAt: "desc" },
        take,
        skip,
      });
    },

    gig: async (_parent, args, context) => {
      const actorUserId = requireUserId(context);
      const gig = await prisma.gig.findUnique({
        where: { id: args.id },
        include: gigCountInclude,
      });
      if (!gig) return null;

      const member = await prisma.member.findUnique({
        where: {
          companyId_userId: {
            companyId: gig.companyId,
            userId: actorUserId,
          },
        },
        select: { id: true },
      });
      if (!member) throw new Error("Forbidden.");

      return gig;
    },

    gigReview: async (_parent, args, context) => {
      const actorUserId = requireUserId(context);
      const review = await prisma.gigReview.findUnique({
        where: { id: args.id },
        include: reviewInclude,
      });
      if (!review) return null;

      const assignment = await prisma.gigAssignment.findUnique({
        where: { id: review.assignmentId },
        select: { gig: { select: { companyId: true } } },
      });

      const membership = await prisma.member.findUnique({
        where: {
          companyId_userId: {
            companyId: assignment!.gig.companyId,
            userId: actorUserId,
          },
        },
        select: { id: true },
      });
      if (!membership) throw new Error("Forbidden.");

      return review;
    },

    gigReviewsForGig: async (_parent, args, context) => {
      const actorUserId = requireUserId(context);
      const { take, skip } = normalizePagination(args.limit, args.offset);

      const gig = await prisma.gig.findUnique({
        where: { id: args.gigId },
        select: { companyId: true },
      });
      if (!gig) throw new Error("Gig not found.");

      const membership = await prisma.member.findUnique({
        where: {
          companyId_userId: {
            companyId: gig.companyId,
            userId: actorUserId,
          },
        },
        select: { id: true },
      });
      if (!membership) throw new Error("Forbidden.");

      return prisma.gigReview.findMany({
        where: {
          assignment: {
            gigId: args.gigId,
          },
        },
        include: reviewInclude,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      });
    },

    gigs: async (_parent, args, context) => {
      const actorUserId = requireUserId(context);
      const memberships = await prisma.member.findMany({
        where: { userId: actorUserId },
        select: { companyId: true },
      });
      const companyIds = memberships.map((membership) => membership.companyId);

      let where;

      if (args.companyId) {
        if (!companyIds.includes(args.companyId)) {
          throw new Error("Forbidden.");
        }
        where = {
          companyId: args.companyId,
          ...(args.status ? { status: args.status } : {}),
        };
      } else if (args.status === "OPEN") {
        // Profile feed should show all public OPEN gigs across companies.
        where = { status: "OPEN" };
      } else {
        if (companyIds.length === 0) return [];
        where = {
          companyId: { in: companyIds },
          ...(args.status ? { status: args.status } : {}),
        };
      }

      const { take, skip } = normalizePagination(args.limit, args.offset);

      return prisma.gig.findMany({
        where,
        include: gigCountInclude,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      });
    },

    gigAssignments: async (_parent, args, context) => {
      const actorUserId = requireUserId(context);

      const gig = await prisma.gig.findUnique({
        where: { id: args.gigId },
        select: { companyId: true },
      });
      if (!gig) throw new Error("Gig not found.");

      const membership = await prisma.member.findUnique({
        where: {
          companyId_userId: {
            companyId: gig.companyId,
            userId: actorUserId,
          },
        },
        select: { id: true },
      });
      if (!membership) throw new Error("Forbidden.");

      const { take, skip } = normalizePagination(args.limit, args.offset);

      return prisma.gigAssignment.findMany({
        where: { gigId: args.gigId },
        include: assignmentInclude,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      });
    },

    myAssignments: async (_parent, args, context) => {
      const userId = requireUserId(context);
      const { take, skip } = normalizePagination(args.limit, args.offset);
      return prisma.gigAssignment.findMany({
        where: { userId },
        include: assignmentInclude,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      });
    },

    assignmentHistory: async (_parent, args, context) => {
      const actorUserId = requireUserId(context);
      const targetUserId = args.userId ?? actorUserId;

      if (targetUserId !== actorUserId) {
        await requireAdminRole(context);
      }

      const { take, skip } = normalizePagination(args.limit, args.offset);

      return prisma.gigAssignment.findMany({
        where: { userId: targetUserId },
        include: assignmentInclude,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      });
    },

    starsTransactions: async (_parent, args, context) => {
      const actorProfileId = await requireProfileId(context);
      const contractorId = args.contractorId ?? actorProfileId;

      if (contractorId !== actorProfileId) await requireAdminRole(context);

      const { take, skip } = normalizePagination(args.limit, args.offset);
      return prisma.starsTransaction.findMany({
        where: { contractorId },
        include: starsTransactionInclude,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      });
    },

    moneyTransactions: async (_parent, args, context) => {
      const actorProfileId = await requireProfileId(context);
      const contractorId = args.contractorId ?? actorProfileId;

      if (contractorId !== actorProfileId) await requireAdminRole(context);

      const { take, skip } = normalizePagination(args.limit, args.offset);
      return prisma.moneyTransaction.findMany({
        where: { contractorId },
        include: moneyTransactionInclude,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      });
    },

    myStarsTransactions: async (_parent, args, context) => {
      const contractorId = await requireProfileId(context);
      const { take, skip } = normalizePagination(args.limit, args.offset);
      return prisma.starsTransaction.findMany({
        where: { contractorId },
        include: starsTransactionInclude,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      });
    },

    myMoneyTransactions: async (_parent, args, context) => {
      const contractorId = await requireProfileId(context);
      const { take, skip } = normalizePagination(args.limit, args.offset);
      return prisma.moneyTransaction.findMany({
        where: { contractorId },
        include: moneyTransactionInclude,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      });
    },

    product: async (_parent, args, context) => {
      requireUserId(context);
      return prisma.product.findUnique({
        where: { id: args.id },
        include: productInclude,
      });
    },

    products: async (_parent, args, context) => {
      requireUserId(context);
      const { take, skip } = normalizePagination(args.limit, args.offset);
      return prisma.product.findMany({
        where: {
          ...(args.category ? { category: args.category } : {}),
          ...(args.tier ? { tier: args.tier } : {}),
        },
        include: productInclude,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      });
    },

    purchase: async (_parent, args, context) => {
      const actorProfileId = await requireProfileId(context);
      const purchase = await prisma.purchase.findUnique({
        where: { id: args.id },
        include: purchaseInclude,
      });
      if (!purchase) return null;
      if (purchase.contractorId !== actorProfileId) throw new Error("Forbidden.");
      return purchase;
    },

    purchases: async (_parent, args, context) => {
      const actorProfileId = await requireProfileId(context);
      const contractorId = args.contractorId ?? actorProfileId;
      if (contractorId !== actorProfileId) await requireAdminRole(context);

      const { take, skip } = normalizePagination(args.limit, args.offset);
      return prisma.purchase.findMany({
        where: {
          contractorId,
          ...(args.status ? { status: args.status } : {}),
        },
        include: purchaseInclude,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      });
    },

    myPurchases: async (_parent, args, context) => {
      const contractorId = await requireProfileId(context);
      const { take, skip } = normalizePagination(args.limit, args.offset);
      return prisma.purchase.findMany({
        where: {
          contractorId,
          ...(args.status ? { status: args.status } : {}),
        },
        include: purchaseInclude,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      });
    },

    myWatchlist: async (_parent, args, context) => {
      const userId = requireUserId(context);
      const { take, skip } = normalizePagination(args.limit, args.offset);

      // Defensive cleanup: keep watchlist limited to gigs that are still not assigned.
      await prisma.watchlist.deleteMany({
        where: {
          userId,
          gig: {
            status: { notIn: ["DRAFT", "OPEN"] },
          },
        },
      });

      return prisma.watchlist.findMany({
        where: { userId },
        include: watchlistInclude,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      });
    },

    companies: async (_parent, args, context) => {
      await requireAdminRole(context);
      const { take, skip } = normalizePagination(args.limit, args.offset);
      return prisma.company.findMany({
        orderBy: { name: "asc" },
        take,
        skip,
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

    members: async (_parent, args, context) => {
      await requireAdminRole(context);
      const { take, skip } = normalizePagination(args.limit, args.offset);
      return prisma.member.findMany({
        orderBy: { createdAt: "desc" },
        take,
        skip,
      });
    },
  },

  // ─── Type field resolvers ─────────────────────────────────────────────────
  // Relations are loaded lazily: single-record relations via DataLoaders
  // (request-scoped, automatically batched), one-to-many relations via direct
  // paginated Prisma queries. No blanket eager-loading anywhere.

  User: {
    profile: (parent, _args, { loaders }) => loaders.profileByUserId.load(parent.id),
    companies: (parent, _args, { loaders }) => loaders.membersByUserId.load(parent.id),
    createdGigs: (parent) =>
      prisma.gig.findMany({ where: { createdByUserId: parent.id }, orderBy: { createdAt: "desc" } }),
    assignments: (parent) =>
      prisma.gigAssignment.findMany({ where: { userId: parent.id }, orderBy: { createdAt: "desc" } }),
    watchlistEntries: async (parent, args, context) => {
      const actorUserId = requireUserId(context);
      if (parent.id !== actorUserId) throw new Error("Forbidden.");
      const { take, skip } = normalizePagination(args?.limit, args?.offset);
      return prisma.watchlist.findMany({
        where: { userId: parent.id },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      });
    },
  },

  Profile: {
    starsTransactions: (parent, args) => {
      const { take, skip } = normalizePagination(args?.limit, args?.offset);
      return prisma.starsTransaction.findMany({
        where: { contractorId: parent.id },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      });
    },
    moneyTransactions: (parent, args) => {
      const { take, skip } = normalizePagination(args?.limit, args?.offset);
      return prisma.moneyTransaction.findMany({
        where: { contractorId: parent.id },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      });
    },
    purchases: (parent, args) => {
      const { take, skip } = normalizePagination(args?.limit, args?.offset);
      return prisma.purchase.findMany({
        where: { contractorId: parent.id },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      });
    },
  },

  Company: {
    members: (parent, _args, { loaders }) => loaders.membersByCompanyId.load(parent.id),
    gigs: (parent, _args, { loaders }) => loaders.gigsByCompanyId.load(parent.id),
  },

  Member: {
    company: (parent, _args, { loaders }) => loaders.companyById.load(parent.companyId),
    user: (parent, _args, { loaders }) => loaders.userById.load(parent.userId),
  },

  CompanyMembershipRequest: {
    company: (parent, _args, { loaders }) => loaders.companyById.load(parent.companyId),
    user: (parent, _args, { loaders }) => loaders.userById.load(parent.userId),
    resolvedBy: (parent, _args, { loaders }) =>
      parent.resolvedByUserId ? loaders.userById.load(parent.resolvedByUserId) : null,
  },

  Gig: {
    currentPriceCents: (parent) => computeCurrentPriceCents(parent),
    ageBonusStars: (parent) => computeAgeBonusStars(parent),
    repostBonusStars: (parent) => computeRepostBonusStars(parent),
    // Legacy field: persisted value only.
    bonusStars: (parent) => parent.bonusStars ?? null,
    totalStarsReward: (parent) =>
      coerceNonNegativeInt(parent.baseStars, 0) +
      computeAgeBonusStars(parent) +
      computeRepostBonusStars(parent),
    company: (parent, _args, { loaders }) => loaders.companyById.load(parent.companyId),
    createdBy: (parent, _args, { loaders }) => loaders.userById.load(parent.createdByUserId),
    location: (parent, _args, { loaders }) =>
      parent.locationId ? loaders.locationById.load(parent.locationId) : null,
    assignments: (parent, _args, { loaders }) => loaders.assignmentsByGigId.load(parent.id),
    watchlistEntries: (parent, args) => {
      const { take, skip } = normalizePagination(args?.limit, args?.offset);
      return prisma.watchlist.findMany({
        where: { gigId: parent.id },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      });
    },
    watchlistCount: (parent) => {
      if (parent?._count?.watchlistEntries !== undefined) {
        return parent._count.watchlistEntries;
      }
      return prisma.watchlist.count({ where: { gigId: parent.id } });
    },
  },

  GigAssignment: {
    gig: (parent, _args, { loaders }) => loaders.gigById.load(parent.gigId),
    user: (parent, _args, { loaders }) => loaders.userById.load(parent.userId),
    review: (parent, _args, { loaders }) => loaders.reviewByAssignmentId.load(parent.id),
    purchases: (parent, _args, { loaders }) => loaders.purchasesByAssignmentId.load(parent.id),
  },

  GigReview: {
    assignment: (parent, _args, { loaders }) => loaders.assignmentById.load(parent.assignmentId),
    reviewerMember: (parent, _args, { loaders }) => loaders.memberById.load(parent.reviewerMemberId),
  },

  StarsTransaction: {
    contractor: (parent, _args, { loaders }) => loaders.profileById.load(parent.contractorId),
    gig: (parent, _args, { loaders }) =>
      parent.gigId ? loaders.gigById.load(parent.gigId) : null,
    assignment: (parent, _args, { loaders }) =>
      parent.assignmentId ? loaders.assignmentById.load(parent.assignmentId) : null,
  },

  MoneyTransaction: {
    contractor: (parent, _args, { loaders }) => loaders.profileById.load(parent.contractorId),
    gig: (parent, _args, { loaders }) =>
      parent.gigId ? loaders.gigById.load(parent.gigId) : null,
    assignment: (parent, _args, { loaders }) =>
      parent.assignmentId ? loaders.assignmentById.load(parent.assignmentId) : null,
  },

  Purchase: {
    contractor: (parent, _args, { loaders }) => loaders.profileById.load(parent.contractorId),
    product: (parent, _args, { loaders }) => loaders.productById.load(parent.productId),
    assignment: (parent, _args, { loaders }) =>
      parent.appliedToAssignmentId ? loaders.assignmentById.load(parent.appliedToAssignmentId) : null,
  },

  Product: {
    purchases: (parent, args) => {
      const { take, skip } = normalizePagination(args?.limit, args?.offset);
      return prisma.purchase.findMany({
        where: { productId: parent.id },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      });
    },
  },

  Watchlist: {
    user: (parent, _args, { loaders }) => loaders.userById.load(parent.userId),
    gig: (parent, _args, { loaders }) => loaders.gigById.load(parent.gigId),
  },

  Mutation: {
    register: async (_parent, args) => {
      const { email, password } = args;

      validateEmail(email);
      validatePassword(password);

      const existing = await prisma.user.findUnique({ where: { email: email.trim() } });
      if (existing) throw new Error("Email already in use.");

      const passwordHash = await argon2.hash(password);

      const user = await prisma.user.create({
        data: { email: email.trim(), passwordHash },
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

    requestPasswordReset: async (_parent, args) => {
      const email = args.email.trim();

      // Generate token before the user lookup so constant-time crypto work
      // always runs regardless of whether the account exists, reducing the
      // timing gap between the found and not-found paths.
      const rawToken = generatePasswordResetToken();
      const tokenHash = hashPasswordResetToken(rawToken);

      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true },
      });

      // Always return success to avoid revealing whether an account exists.
      if (!user) return true;

      await prisma.$transaction(async (tx) => {
        // One active reset token per user: invalidate previous links on each request.
        await tx.passwordResetToken.deleteMany({
          where: { userId: user.id },
        });

        await tx.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash,
            expiresAt: passwordResetTokenExpiryDate(),
          },
        });
      });

      const resetUrl = buildPasswordResetUrl(rawToken);
      await sendPasswordResetEmail({
        toEmail: user.email,
        resetUrl,
      });

      return true;
    },

    resetPassword: async (_parent, args) => {
      validatePassword(args.newPassword);

      const tokenHash = hashPasswordResetToken(args.token);
      const existing = await prisma.passwordResetToken.findUnique({
        where: { tokenHash },
        select: {
          id: true,
          userId: true,
          usedAt: true,
          expiresAt: true,
        },
      });

      if (!existing) throw new Error("Invalid or expired password reset token.");
      if (existing.usedAt) throw new Error("Invalid or expired password reset token.");
      if (existing.expiresAt <= new Date()) {
        throw new Error("Invalid or expired password reset token.");
      }

      const passwordHash = await argon2.hash(args.newPassword);

      await prisma.$transaction(async (tx) => {
        // updateMany gives us atomic "use once" semantics with preconditions.
        const markedUsed = await tx.passwordResetToken.updateMany({
          where: {
            id: existing.id,
            usedAt: null,
            expiresAt: { gt: new Date() },
          },
          data: {
            usedAt: new Date(),
          },
        });

        if (markedUsed.count !== 1) {
          throw new Error("Invalid or expired password reset token.");
        }

        await tx.user.update({
          where: { id: existing.userId },
          data: { passwordHash },
        });

        // Force sign-in again on all devices after password reset.
        await tx.refreshToken.deleteMany({
          where: { userId: existing.userId },
        });

        await tx.passwordResetToken.deleteMany({
          where: {
            userId: existing.userId,
            id: { not: existing.id },
          },
        });
      });

      return true;
    },

    addGigToWatchlist: async (_parent, args, context) => {
      const userId = requireUserId(context);
      const { gigId } = args;

      const gig = await prisma.gig.findUnique({
        where: { id: gigId },
        select: { id: true, status: true },
      });
      if (!gig) throw new Error("Gig not found.");

      if (!["DRAFT", "OPEN"].includes(gig.status)) {
        throw new Error("Only unassigned gigs can be watched.");
      }

      const existingAssignment = await prisma.gigAssignment.findFirst({
        where: { gigId },
        select: { id: true },
      });
      if (existingAssignment) throw new Error("Gig is already assigned.");

      return prisma.watchlist.upsert({
        where: {
          userId_gigId: {
            userId,
            gigId,
          },
        },
        create: {
          userId,
          gigId,
        },
        update: {},
        include: watchlistInclude,
      });
    },

    removeGigFromWatchlist: async (_parent, args, context) => {
      const userId = requireUserId(context);
      const { gigId } = args;

      await prisma.watchlist.deleteMany({
        where: {
          userId,
          gigId,
        },
      });

      return true;
    },

    deleteUser: async (_parent, args, context) => {
      await requireAdminRole(context);
      const userId = args.id;

      await prisma.$transaction(async (tx) => {
        const profile = await tx.profile.findUnique({
          where: { userId },
          select: { id: true },
        });
        const gigs = await tx.gig.findMany({
          where: { createdByUserId: userId },
          select: { id: true },
        });
        const gigIds = gigs.map((gig) => gig.id);

        if (gigIds.length > 0) {
          await tx.starsTransaction.deleteMany({
            where: {
              OR: [
                { gigId: { in: gigIds } },
                { assignment: { gigId: { in: gigIds } } },
              ],
            },
          });
          await tx.moneyTransaction.deleteMany({
            where: {
              OR: [
                { gigId: { in: gigIds } },
                { assignment: { gigId: { in: gigIds } } },
              ],
            },
          });
          await tx.gigReview.deleteMany({
            where: {
              assignment: {
                gigId: { in: gigIds },
              },
            },
          });
          await tx.purchase.deleteMany({
            where: {
              assignment: {
                gigId: { in: gigIds },
              },
            },
          });
          await tx.watchlist.deleteMany({ where: { gigId: { in: gigIds } } });
          await tx.gigAssignment.deleteMany({ where: { gigId: { in: gigIds } } });
          await tx.gig.deleteMany({ where: { id: { in: gigIds } } });
        }

        await tx.gigReview.deleteMany({
          where: {
            OR: [
              { assignment: { userId } },
              { reviewerMember: { userId } },
            ],
          },
        });
        if (profile) {
          await tx.starsTransaction.deleteMany({
            where: { contractorId: profile.id },
          });
          await tx.moneyTransaction.deleteMany({
            where: { contractorId: profile.id },
          });
          await tx.purchase.deleteMany({
            where: { contractorId: profile.id },
          });
        }
        await tx.gigAssignment.deleteMany({
          where: { userId },
        });
        await tx.watchlist.deleteMany({ where: { userId } });
        await tx.passwordResetToken.deleteMany({ where: { userId } });
        await tx.refreshToken.deleteMany({ where: { userId } });
        await tx.companyMembershipRequest.deleteMany({
          where: {
            OR: [{ userId }, { resolvedByUserId: userId }],
          },
        });
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

      const data: Record<string, unknown> = {};
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
      const profile = await prisma.profile.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!profile) return false;

      await prisma.$transaction(async (tx) => {
        await tx.starsTransaction.deleteMany({
          where: { contractorId: profile.id },
        });
        await tx.moneyTransaction.deleteMany({
          where: { contractorId: profile.id },
        });
        await tx.purchase.deleteMany({
          where: { contractorId: profile.id },
        });
        await tx.profile.delete({
          where: { id: profile.id },
        });
      });

      return true;
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

      const data: Record<string, unknown> = {};
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
        const gigs = await tx.gig.findMany({
          where: { companyId },
          select: { id: true },
        });
        const gigIds = gigs.map((gig) => gig.id);
        if (gigIds.length > 0) {
          await tx.starsTransaction.deleteMany({
            where: {
              OR: [
                { gigId: { in: gigIds } },
                { assignment: { gigId: { in: gigIds } } },
              ],
            },
          });
          await tx.moneyTransaction.deleteMany({
            where: {
              OR: [
                { gigId: { in: gigIds } },
                { assignment: { gigId: { in: gigIds } } },
              ],
            },
          });
          await tx.gigReview.deleteMany({
            where: {
              assignment: {
                gigId: { in: gigIds },
              },
            },
          });
          await tx.purchase.deleteMany({
            where: {
              assignment: {
                gigId: { in: gigIds },
              },
            },
          });
          await tx.gigAssignment.deleteMany({ where: { gigId: { in: gigIds } } });
          await tx.gig.deleteMany({ where: { id: { in: gigIds } } });
        }
        await tx.gigReview.deleteMany({
          where: {
            reviewerMember: {
              companyId,
            },
          },
        });
        await tx.companyMembershipRequest.deleteMany({ where: { companyId } });
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
        const member = await prisma.member.create({
          data: { companyId, userId, role },
          include: memberInclude,
        });
        await prisma.companyMembershipRequest.updateMany({
          where: {
            companyId,
            userId,
            status: "PENDING",
          },
          data: {
            status: "APPROVED",
            resolvedByUserId: actorUserId,
            resolvedAt: new Date(),
            resolvedNote: null,
          },
        });
        return member;
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

    requestCompanyMembership: async (_parent, args, context) => {
      const actorUserId = requireUserId(context);
      const requestedRole = args.requestedRole ?? "APPROVER";
      const note = args.note?.trim() || null;

      const company = await prisma.company.findUnique({
        where: { id: args.companyId },
        select: { id: true },
      });
      if (!company) throw new Error("Company not found.");

      const existingMember = await prisma.member.findUnique({
        where: {
          companyId_userId: {
            companyId: args.companyId,
            userId: actorUserId,
          },
        },
        select: { id: true },
      });
      if (existingMember) throw new Error("You are already a member of this company.");

      const existingRequest = await prisma.companyMembershipRequest.findUnique({
        where: {
          companyId_userId: {
            companyId: args.companyId,
            userId: actorUserId,
          },
        },
      });

      if (existingRequest?.status === "PENDING") {
        throw new Error("Membership request is already pending.");
      }

      if (existingRequest) {
        return prisma.companyMembershipRequest.update({
          where: { id: existingRequest.id },
          data: {
            requestedRole,
            note,
            status: "PENDING",
            resolvedByUserId: null,
            resolvedNote: null,
            resolvedAt: null,
          },
          include: membershipRequestInclude,
        });
      }

      return prisma.companyMembershipRequest.create({
        data: {
          companyId: args.companyId,
          userId: actorUserId,
          requestedRole,
          note,
          status: "PENDING",
        },
        include: membershipRequestInclude,
      });
    },

    approveCompanyMembershipRequest: async (_parent, args, context) => {
      const actorUserId = requireUserId(context);

      const request = await prisma.companyMembershipRequest.findUnique({
        where: { id: args.requestId },
      });
      if (!request) throw new Error("Membership request not found.");
      if (request.status !== "PENDING") {
        throw new Error("Only pending membership requests can be approved.");
      }

      await ensureCompanyOwner(request.companyId, actorUserId);

      const approvedRole = args.role ?? request.requestedRole ?? "APPROVER";

      return prisma.$transaction(async (tx) => {
        const member = await tx.member.upsert({
          where: {
            companyId_userId: {
              companyId: request.companyId,
              userId: request.userId,
            },
          },
          create: {
            companyId: request.companyId,
            userId: request.userId,
            role: approvedRole,
          },
          update: {
            role: approvedRole,
          },
          include: memberInclude,
        });

        await tx.companyMembershipRequest.update({
          where: { id: request.id },
          data: {
            status: "APPROVED",
            resolvedByUserId: actorUserId,
            resolvedAt: new Date(),
            resolvedNote: null,
          },
        });

        return member;
      });
    },

    denyCompanyMembershipRequest: async (_parent, args, context) => {
      const actorUserId = requireUserId(context);
      const reason = args.reason?.trim() || null;

      const request = await prisma.companyMembershipRequest.findUnique({
        where: { id: args.requestId },
      });
      if (!request) throw new Error("Membership request not found.");
      if (request.status !== "PENDING") {
        throw new Error("Only pending membership requests can be denied.");
      }

      await ensureCompanyOwner(request.companyId, actorUserId);

      return prisma.companyMembershipRequest.update({
        where: { id: request.id },
        data: {
          status: "DENIED",
          resolvedByUserId: actorUserId,
          resolvedAt: new Date(),
          resolvedNote: reason,
        },
        include: membershipRequestInclude,
      });
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

    createGig: async (_parent, args, context) => {
      const actorUserId = requireUserId(context);
      const {
        companyId,
        title,
        description,
        type,
        locationId,
        startsAt,
        endsAt,
        payCents,
        units,
        basePriceCents,
        bumpEverySeconds,
        bumpCents,
        maxBumps,
        maxPriceCents,
        baseStars,
        starsBumpEverySeconds,
        starsBumpAmount,
        maxAgeBonusStars,
        repostBonusPerRepost,
        requiredTier,
        status,
      } = args;

      await ensureCompanyRole(companyId, actorUserId, ["OWNER", "MANAGER", "CREATOR"]);

      const startsAtDate = startsAt ? new Date(startsAt) : null;
      const endsAtDate = endsAt ? new Date(endsAt) : null;
      if (startsAt && Number.isNaN(startsAtDate!.getTime())) throw new Error("Invalid startsAt.");
      if (endsAt && Number.isNaN(endsAtDate!.getTime())) throw new Error("Invalid endsAt.");
      if (bumpEverySeconds !== undefined && bumpEverySeconds <= 0) {
        throw new Error("bumpEverySeconds must be greater than 0.");
      }
      if (bumpCents !== undefined && bumpCents < 0) {
        throw new Error("bumpCents must be non-negative.");
      }
      if (maxBumps !== undefined && maxBumps !== null && maxBumps < 0) {
        throw new Error("maxBumps must be non-negative.");
      }
      if (maxPriceCents !== undefined && maxPriceCents !== null && maxPriceCents < 0) {
        throw new Error("maxPriceCents must be non-negative.");
      }
      if (baseStars !== undefined && baseStars < 0) {
        throw new Error("baseStars must be non-negative.");
      }
      if (starsBumpEverySeconds !== undefined && starsBumpEverySeconds <= 0) {
        throw new Error("starsBumpEverySeconds must be greater than 0.");
      }
      if (starsBumpAmount !== undefined && starsBumpAmount < 0) {
        throw new Error("starsBumpAmount must be non-negative.");
      }
      if (maxAgeBonusStars !== undefined && maxAgeBonusStars !== null && maxAgeBonusStars < 0) {
        throw new Error("maxAgeBonusStars must be non-negative.");
      }
      if (repostBonusPerRepost !== undefined && repostBonusPerRepost < 0) {
        throw new Error("repostBonusPerRepost must be non-negative.");
      }
      if (!locationId?.trim()) throw new Error("Location is required.");
      const existingLocation = await prisma.location.findUnique({
        where: { id: locationId },
        select: { id: true },
      });
      if (!existingLocation) throw new Error("Location not found.");

      return prisma.gig.create({
        data: {
          companyId,
          createdByUserId: actorUserId,
          title: title.trim(),
          description: description?.trim() || null,
          type: type ?? "STANDARD",
          locationId,
          startsAt: startsAtDate,
          endsAt: endsAtDate,
          payCents: payCents ?? null,
          units: units ?? null,
          // Persist base values + configuration only; API read-path computes live values.
          basePriceCents: basePriceCents ?? payCents ?? 0,
          bumpEverySeconds: bumpEverySeconds ?? 1800,
          bumpCents: bumpCents ?? 100,
          maxBumps: maxBumps ?? null,
          maxPriceCents: maxPriceCents ?? null,
          baseStars: baseStars ?? 5,
          starsBumpEverySeconds: starsBumpEverySeconds ?? 1800,
          starsBumpAmount: starsBumpAmount ?? 1,
          maxAgeBonusStars: maxAgeBonusStars ?? null,
          repostBonusPerRepost: repostBonusPerRepost ?? 1,
          requiredTier: requiredTier ?? null,
          status: status ?? "DRAFT",
        },
        include: gigInclude,
      });
    },

    updateGig: async (_parent, args, context) => {
      const actorUserId = requireUserId(context);
      const { gigId } = args;

      const gig = await prisma.gig.findUnique({
        where: { id: gigId },
        select: { companyId: true },
      });
      if (!gig) throw new Error("Gig not found.");

      await ensureCompanyRole(gig.companyId, actorUserId, ["OWNER", "MANAGER", "CREATOR"]);

      const data: Record<string, unknown> = {};
      if (args.title !== undefined) data.title = args.title.trim();
      if (args.description !== undefined) data.description = args.description?.trim() || null;
      if (args.type !== undefined) data.type = args.type;
      if (args.locationId !== undefined) {
        if (args.locationId === null) {
          data.locationId = null;
        } else {
          const existingLocation = await prisma.location.findUnique({
            where: { id: args.locationId },
            select: { id: true },
          });
          if (!existingLocation) throw new Error("Location not found.");
          data.locationId = args.locationId;
        }
      }
      if (args.startsAt !== undefined) {
        if (args.startsAt === null) {
          data.startsAt = null;
        } else {
          const startsAtDate = new Date(args.startsAt);
          if (Number.isNaN(startsAtDate.getTime())) throw new Error("Invalid startsAt.");
          data.startsAt = startsAtDate;
        }
      }
      if (args.endsAt !== undefined) {
        if (args.endsAt === null) {
          data.endsAt = null;
        } else {
          const endsAtDate = new Date(args.endsAt);
          if (Number.isNaN(endsAtDate.getTime())) throw new Error("Invalid endsAt.");
          data.endsAt = endsAtDate;
        }
      }
      if (args.payCents !== undefined) data.payCents = args.payCents;
      if (args.units !== undefined) data.units = args.units;
      if (args.basePriceCents !== undefined) data.basePriceCents = args.basePriceCents;
      if (args.bumpEverySeconds !== undefined) {
        if (args.bumpEverySeconds <= 0) {
          throw new Error("bumpEverySeconds must be greater than 0.");
        }
        data.bumpEverySeconds = args.bumpEverySeconds;
      }
      if (args.bumpCents !== undefined) {
        if (args.bumpCents < 0) throw new Error("bumpCents must be non-negative.");
        data.bumpCents = args.bumpCents;
      }
      if (args.maxBumps !== undefined) {
        if (args.maxBumps !== null && args.maxBumps < 0) {
          throw new Error("maxBumps must be non-negative.");
        }
        data.maxBumps = args.maxBumps;
      }
      if (args.maxPriceCents !== undefined) {
        if (args.maxPriceCents !== null && args.maxPriceCents < 0) {
          throw new Error("maxPriceCents must be non-negative.");
        }
        data.maxPriceCents = args.maxPriceCents;
      }
      if (args.baseStars !== undefined) {
        if (args.baseStars < 0) throw new Error("baseStars must be non-negative.");
        data.baseStars = args.baseStars;
      }
      if (args.starsBumpEverySeconds !== undefined) {
        if (args.starsBumpEverySeconds <= 0) {
          throw new Error("starsBumpEverySeconds must be greater than 0.");
        }
        data.starsBumpEverySeconds = args.starsBumpEverySeconds;
      }
      if (args.starsBumpAmount !== undefined) {
        if (args.starsBumpAmount < 0) {
          throw new Error("starsBumpAmount must be non-negative.");
        }
        data.starsBumpAmount = args.starsBumpAmount;
      }
      if (args.maxAgeBonusStars !== undefined) {
        if (args.maxAgeBonusStars !== null && args.maxAgeBonusStars < 0) {
          throw new Error("maxAgeBonusStars must be non-negative.");
        }
        data.maxAgeBonusStars = args.maxAgeBonusStars;
      }
      if (args.repostBonusPerRepost !== undefined) {
        if (args.repostBonusPerRepost < 0) {
          throw new Error("repostBonusPerRepost must be non-negative.");
        }
        data.repostBonusPerRepost = args.repostBonusPerRepost;
      }
      // currentPriceCents is derived from age + config; direct writes are ignored.
      if (args.requiredTier !== undefined) data.requiredTier = args.requiredTier;

      if (Object.keys(data).length === 0) {
        throw new Error("No gig fields provided.");
      }

      return prisma.gig.update({
        where: { id: gigId },
        data,
        include: gigInclude,
      });
    },

    updateGigStatus: async (_parent, args, context) => {
      const actorUserId = requireUserId(context);
      const { gigId, status } = args;

      const gig = await prisma.gig.findUnique({
        where: { id: gigId },
        select: { companyId: true },
      });
      if (!gig) throw new Error("Gig not found.");

      await ensureCompanyRole(gig.companyId, actorUserId, [
        "OWNER",
        "MANAGER",
        "APPROVER",
        "CREATOR",
      ]);

      return prisma.gig.update({
        where: { id: gigId },
        data: { status },
        include: gigInclude,
      });
    },

    deleteGig: async (_parent, args, context) => {
      const actorUserId = requireUserId(context);
      const { gigId } = args;

      const gig = await prisma.gig.findUnique({
        where: { id: gigId },
        select: { id: true, companyId: true },
      });
      if (!gig) throw new Error("Gig not found.");

      await ensureCompanyRole(gig.companyId, actorUserId, ["OWNER", "MANAGER", "CREATOR"]);

      await prisma.$transaction(async (tx) => {
        await tx.starsTransaction.deleteMany({
          where: {
            OR: [{ gigId }, { assignment: { gigId } }],
          },
        });
        await tx.moneyTransaction.deleteMany({
          where: {
            OR: [{ gigId }, { assignment: { gigId } }],
          },
        });
        await tx.gigReview.deleteMany({
          where: {
            assignment: { gigId },
          },
        });
        await tx.purchase.deleteMany({
          where: {
            assignment: { gigId },
          },
        });
        await tx.watchlist.deleteMany({ where: { gigId } });
        await tx.gigAssignment.deleteMany({ where: { gigId } });
        await tx.gig.delete({ where: { id: gigId } });
      });

      return true;
    },

    claimGig: async (_parent, args, context) => {
      const actorUserId = requireUserId(context);
      const { gigId, note } = args;

      return prisma.$transaction(async (tx) => {
        const gig = await tx.gig.findUnique({
          where: { id: gigId },
          select: { id: true, status: true },
        });
        if (!gig) throw new Error("Gig not found.");
        if (gig.status !== "OPEN") throw new Error("Gig is not open for claiming.");

        const existingAssignment = await tx.gigAssignment.findFirst({
          where: { gigId },
          select: { id: true },
        });
        if (existingAssignment) throw new Error("Gig is already assigned.");

        const assignment = await tx.gigAssignment.create({
          data: {
            gigId,
            userId: actorUserId,
            note: note?.trim() || null,
            status: "CLAIMED",
          },
          include: assignmentInclude,
        });

        // Once a gig is assigned, it should no longer appear in anyone's watchlist.
        await tx.watchlist.deleteMany({
          where: { gigId },
        });

        await tx.gig.update({
          where: { id: gigId },
          data: { status: "CLAIMED" },
        });

        return assignment;
      });
    },

    updateAssignmentStatus: async (_parent, args, context) => {
      const actorUserId = requireUserId(context);
      const { assignmentId, status, note, startImageUrls, endImageUrls } = args;

      const assignment = await prisma.gigAssignment.findUnique({
        where: { id: assignmentId },
        include: { gig: { select: gigPayoutSelect } },
      });
      if (!assignment) throw new Error("Assignment not found.");

      const actorMembership = await prisma.member.findUnique({
        where: {
          companyId_userId: {
            companyId: assignment.gig.companyId,
            userId: actorUserId,
          },
        },
        select: { role: true },
      });
      const isAssignee = assignment.userId === actorUserId;
      const isCompanyAdmin =
        actorMembership && ["OWNER", "MANAGER", "APPROVER"].includes(actorMembership.role);
      if (!isAssignee && !isCompanyAdmin) throw new Error("Forbidden.");
      if (status === "COMPLETED" && !isCompanyAdmin) {
        throw new Error("Only company approvers/managers/owners can complete assignments.");
      }

      const data: Record<string, unknown> = {
        status,
        ...(note !== undefined ? { note: note?.trim() || null } : {}),
      };
      if (status === "STARTED") {
        const normalizedStartImages = normalizeImageUrls(startImageUrls);
        if (normalizedStartImages.length !== 2) {
          throw new Error("Exactly 2 start photos are required to start an assignment.");
        }
        data.startImageUrls = normalizedStartImages;
        data.startImageUrl = normalizedStartImages[0];
      }
      if (status === "SUBMITTED") {
        const normalizedEndImages = normalizeImageUrls(endImageUrls);
        if (normalizedEndImages.length !== 2) {
          throw new Error("Exactly 2 submission photos are required to submit an assignment.");
        }
        data.endImageUrls = normalizedEndImages;
        data.endImageUrl = normalizedEndImages[0];
      }
      if (status === "STARTED") data.startedAt = new Date();
      if (status === "SUBMITTED") data.submittedAt = new Date();
      if (status === "REVIEWED") data.reviewedAt = new Date();
      if (status === "ACCEPTED") data.acceptedAt = new Date();
      if (status === "COMPLETED") data.completedAt = new Date();

      return prisma.$transaction(async (tx) => {
        const updated = await tx.gigAssignment.update({
          where: { id: assignmentId },
          data,
          include: assignmentInclude,
        });

        if (status === "COMPLETED") {
          await tx.gig.update({
            where: { id: assignment.gig.id },
            data: { status: "COMPLETED" },
          });

          await createPayoutForCompletedAssignment(tx, {
            assignmentId: assignment.id,
            assigneeUserId: assignment.userId,
            gig: assignment.gig,
          });
          await createStarsRewardForCompletedAssignment(tx, {
            assignmentId: assignment.id,
            assigneeUserId: assignment.userId,
            gig: assignment.gig,
          });
        }

        return updated;
      });
    },

    createGigReview: async (_parent, args, context) => {
      const actorUserId = requireUserId(context);
      const { assignmentId, starsRating, decision, comment } = args;

      if (starsRating < 1 || starsRating > 5) {
        throw new Error("starsRating must be between 1 and 5.");
      }

      const assignment = await prisma.gigAssignment.findUnique({
        where: { id: assignmentId },
        include: { gig: { select: gigPayoutSelect }, review: true },
      });
      if (!assignment) throw new Error("Assignment not found.");
      if (assignment.review) throw new Error("Assignment already reviewed.");

      const reviewerMember = await prisma.member.findUnique({
        where: {
          companyId_userId: {
            companyId: assignment.gig.companyId,
            userId: actorUserId,
          },
        },
        select: { id: true, role: true },
      });
      if (!reviewerMember) throw new Error("Forbidden.");
      if (!["OWNER", "MANAGER", "APPROVER"].includes(reviewerMember.role)) {
        throw new Error("Only approvers/managers/owners can review assignments.");
      }

      return prisma.$transaction(async (tx) => {
        const review = await tx.gigReview.create({
          data: {
            assignmentId,
            reviewerMemberId: reviewerMember.id,
            starsRating,
            decision,
            comment: comment?.trim() || null,
          },
          include: reviewInclude,
        });

        await tx.gigAssignment.update({
          where: { id: assignmentId },
          data: {
            reviewedAt: new Date(),
            status: decision === "APPROVED" ? "COMPLETED" : "REVIEWED",
            ...(decision === "APPROVED" ? { completedAt: new Date() } : {}),
          },
        });

        if (decision === "APPROVED") {
          await tx.gig.update({
            where: { id: assignment.gig.id },
            data: { status: "COMPLETED" },
          });

          await createPayoutForCompletedAssignment(tx, {
            assignmentId: assignment.id,
            assigneeUserId: assignment.userId,
            gig: assignment.gig,
          });
          await createStarsRewardForCompletedAssignment(tx, {
            assignmentId: assignment.id,
            assigneeUserId: assignment.userId,
            gig: assignment.gig,
          });
          await maybeUpgradeTierFromFiveStarCompletions(tx, assignment.userId);
        }

        return review;
      });
    },

    createStarsTransaction: async (_parent, args, context) => {
      await requireAdminRole(context);
      const { contractorId, delta, reason, gigId, assignmentId, purchaseId } = args;

      if (delta === 0) {
        throw new Error("delta must be non-zero.");
      }

      if (gigId) {
        const gig = await prisma.gig.findUnique({ where: { id: gigId }, select: { id: true } });
        if (!gig) throw new Error("Gig not found.");
      }
      if (assignmentId) {
        const assignment = await prisma.gigAssignment.findUnique({
          where: { id: assignmentId },
          select: { id: true },
        });
        if (!assignment) throw new Error("Assignment not found.");
      }
      if (purchaseId) {
        const purchase = await prisma.purchase.findUnique({
          where: { id: purchaseId },
          select: { id: true, contractorId: true },
        });
        if (!purchase) throw new Error("Purchase not found.");
        if (purchase.contractorId !== contractorId) throw new Error("Purchase does not belong to contractor.");
      }

      return prisma.$transaction(async (tx) => {
        if (delta < 0) {
          const profile = await tx.profile.findUnique({
            where: { id: contractorId },
            select: { starsBalance: true },
          });
          if (!profile) throw new Error("Profile not found.");
          if (profile.starsBalance + delta < 0) {
            throw new Error("Adjustment would reduce stars balance below zero.");
          }
        }

        const transaction = await tx.starsTransaction.create({
          data: {
            contractorId,
            delta,
            reason,
            gigId: gigId ?? null,
            assignmentId: assignmentId ?? null,
            purchaseId: purchaseId ?? null,
          },
          include: starsTransactionInclude,
        });

        await tx.profile.update({
          where: { id: contractorId },
          data: {
            starsBalance: {
              increment: delta,
            },
          },
        });

        return transaction;
      });
    },

    createMoneyTransaction: async (_parent, args, context) => {
      await requireAdminRole(context);
      const { contractorId, amountCents, reason, gigId, assignmentId } = args;

      if (amountCents === 0) {
        throw new Error("amountCents must be non-zero.");
      }

      if (gigId) {
        const gig = await prisma.gig.findUnique({ where: { id: gigId }, select: { id: true } });
        if (!gig) throw new Error("Gig not found.");
      }
      if (assignmentId) {
        const assignment = await prisma.gigAssignment.findUnique({
          where: { id: assignmentId },
          select: { id: true },
        });
        if (!assignment) throw new Error("Assignment not found.");
      }

      return prisma.moneyTransaction.create({
        data: {
          contractorId,
          amountCents,
          reason,
          gigId: gigId ?? null,
          assignmentId: assignmentId ?? null,
        },
        include: moneyTransactionInclude,
      });
    },

    createProduct: async (_parent, args, context) => {
      await requireAdminRole(context);
      const {
        category,
        tier,
        title,
        subtitle,
        starsCost,
        durationSeconds,
        effectPct,
      } = args;

      if (starsCost < 0) throw new Error("starsCost must be non-negative.");

      return prisma.product.create({
        data: {
          category,
          tier: tier ?? null,
          title: title.trim(),
          subtitle: subtitle?.trim() || null,
          starsCost,
          durationSeconds: durationSeconds ?? null,
          effectPct: effectPct ?? null,
        },
        include: productInclude,
      });
    },

    updateProduct: async (_parent, args, context) => {
      await requireAdminRole(context);
      const { id } = args;
      const data: Record<string, unknown> = {};
      if (args.category !== undefined) data.category = args.category;
      if (args.tier !== undefined) data.tier = args.tier;
      if (args.title !== undefined) data.title = args.title.trim();
      if (args.subtitle !== undefined) data.subtitle = args.subtitle?.trim() || null;
      if (args.starsCost !== undefined) {
        if (args.starsCost < 0) throw new Error("starsCost must be non-negative.");
        data.starsCost = args.starsCost;
      }
      if (args.durationSeconds !== undefined) data.durationSeconds = args.durationSeconds;
      if (args.effectPct !== undefined) data.effectPct = args.effectPct;

      if (Object.keys(data).length === 0) throw new Error("No product fields provided.");

      try {
        return await prisma.product.update({
          where: { id },
          data,
          include: productInclude,
        });
      } catch (error) {
        if (error?.code === "P2025") throw new Error("Product not found.");
        throw error;
      }
    },

    purchaseProduct: async (_parent, args, context) => {
      const actorProfileId = await requireProfileId(context);
      const actorUserId = requireUserId(context);
      const { productId, appliedToAssignmentId } = args;

      const product = await prisma.product.findUnique({
        where: { id: productId },
      });
      if (!product) throw new Error("Product not found.");

      if (appliedToAssignmentId) {
        const assignment = await prisma.gigAssignment.findUnique({
          where: { id: appliedToAssignmentId },
          select: { id: true, userId: true },
        });
        if (!assignment) throw new Error("Assignment not found.");
        if (assignment.userId !== actorUserId) throw new Error("Forbidden.");
      }

      return prisma.$transaction(async (tx) => {
        const profile = await tx.profile.findUnique({
          where: { id: actorProfileId },
          select: { starsBalance: true },
        });
        if (!profile) throw new Error("Profile not found.");
        if (profile.starsBalance < product.starsCost) {
          throw new Error("Insufficient stars balance.");
        }

        const expiresAt =
          product.durationSeconds && product.durationSeconds > 0
            ? new Date(Date.now() + product.durationSeconds * 1000)
            : null;

        const purchase = await tx.purchase.create({
          data: {
            contractorId: actorProfileId,
            productId: product.id,
            expiresAt,
            appliedToAssignmentId: appliedToAssignmentId ?? null,
          },
          include: purchaseInclude,
        });

        await tx.starsTransaction.create({
          data: {
            contractorId: actorProfileId,
            delta: -product.starsCost,
            reason: "SPENT_ON_PRODUCT",
            purchaseId: purchase.id,
            assignmentId: appliedToAssignmentId ?? null,
          },
        });

        await tx.profile.update({
          where: { id: actorProfileId },
          data: {
            starsBalance: {
              decrement: product.starsCost,
            },
          },
        });

        return purchase;
      });
    },

    consumePurchase: async (_parent, args, context) => {
      const actorProfileId = await requireProfileId(context);
      const actorUserId = requireUserId(context);
      const { id, appliedToAssignmentId } = args;

      const purchase = await prisma.purchase.findUnique({
        where: { id },
        include: { product: true },
      });
      if (!purchase) throw new Error("Purchase not found.");
      if (purchase.contractorId !== actorProfileId) throw new Error("Forbidden.");
      if (purchase.status !== "ACTIVE") throw new Error("Purchase is not active.");
      if (purchase.expiresAt && purchase.expiresAt <= new Date()) {
        throw new Error("Purchase has expired.");
      }

      const targetAssignmentId = appliedToAssignmentId ?? purchase.appliedToAssignmentId ?? null;
      if (targetAssignmentId) {
        const assignment = await prisma.gigAssignment.findUnique({
          where: { id: targetAssignmentId },
          select: { id: true, userId: true },
        });
        if (!assignment) throw new Error("Assignment not found.");
        if (assignment.userId !== actorUserId) throw new Error("Forbidden.");
      }

      return prisma.$transaction(async (tx) => {
        const updated = await tx.purchase.update({
          where: { id },
          data: {
            status: "CONSUMED",
            consumedAt: new Date(),
            appliedToAssignmentId: targetAssignmentId,
          },
          include: { product: { select: { category: true, tier: true } } },
        });

        if (updated.product.category === "MEMBERSHIP_UPGRADE" && updated.product.tier) {
          await tx.profile.update({
            where: { id: actorProfileId },
            data: { tier: updated.product.tier },
          });
        }

        // Strip the eagerly-loaded product relation before returning so the
        // field resolver (via DataLoader) handles it consistently.
        const { product: _product, ...purchase } = updated;
        return purchase;
      });
    },

    expirePurchase: async (_parent, args, context) => {
      const actorProfileId = await requireProfileId(context);
      const purchase = await prisma.purchase.findUnique({
        where: { id: args.id },
      });
      if (!purchase) throw new Error("Purchase not found.");
      if (purchase.contractorId !== actorProfileId) throw new Error("Forbidden.");
      if (purchase.status !== "ACTIVE") return purchase;

      return prisma.purchase.update({
        where: { id: args.id },
        data: { status: "EXPIRED" },
        include: purchaseInclude,
      });
    },

    createLocation: async (_parent, args, context) => {
      requireUserId(context);
      return prisma.location.create({
        data: {
          name: args.name.trim(),
          address: args.address.trim(),
          city: args.city.trim(),
          state: args.state.trim(),
          zipcode: args.zipcode.trim(),
          lat: args.lat ?? null,
          lng: args.lng ?? null,
        },
      });
    },

    updateLocation: async (_parent, args, context) => {
      requireUserId(context);

      const data: Record<string, unknown> = {};
      if (args.name !== undefined) data.name = args.name.trim();
      if (args.address !== undefined) data.address = args.address.trim();
      if (args.city !== undefined) data.city = args.city.trim();
      if (args.state !== undefined) data.state = args.state.trim();
      if (args.zipcode !== undefined) data.zipcode = args.zipcode.trim();
      if (args.lat !== undefined) data.lat = args.lat;
      if (args.lng !== undefined) data.lng = args.lng;

      if (Object.keys(data).length === 0) {
        throw new Error("No location fields provided.");
      }

      try {
        return await prisma.location.update({
          where: { id: args.id },
          data,
        });
      } catch (error) {
        if (error?.code === "P2025") {
          throw new Error("Location not found.");
        }
        throw error;
      }
    },

    deleteLocation: async (_parent, args, context) => {
      requireUserId(context);

      await prisma.$transaction(async (tx) => {
        await tx.gig.updateMany({
          where: { locationId: args.id },
          data: { locationId: null },
        });
        await tx.location.delete({
          where: { id: args.id },
        });
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
