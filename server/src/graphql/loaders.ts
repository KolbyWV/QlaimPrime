import DataLoader from "dataloader";
import { prisma } from "../prisma.js";
import type {
  User,
  Profile,
  Company,
  Location,
  Member,
  Gig,
  GigAssignment,
  GigReview,
  Product,
  Purchase,
} from "@prisma/client";

function indexById<T extends Record<string, unknown>>(
  records: T[],
  key: keyof T = "id" as keyof T,
): Map<unknown, T> {
  const map = new Map<unknown, T>();
  for (const r of records) map.set(r[key], r);
  return map;
}

function groupBy<T extends Record<string, unknown>>(
  records: T[],
  key: keyof T,
): Map<unknown, T[]> {
  const groups = new Map<unknown, T[]>();
  for (const r of records) {
    const k = r[key];
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(r);
  }
  return groups;
}

export type Loaders = ReturnType<typeof createLoaders>;

// Creates a fresh set of DataLoaders per request so the per-request cache
// never leaks between users or requests.
export function createLoaders() {
  return {
    // ── Single-record loaders (batch by ID) ──────────────────────────────────

    userById: new DataLoader<string, User | null>(async (ids) => {
      const rows = await prisma.user.findMany({ where: { id: { in: [...ids] } } });
      const map = indexById(rows);
      return ids.map((id) => (map.get(id) as User) ?? null);
    }),

    companyById: new DataLoader<string, Company | null>(async (ids) => {
      const rows = await prisma.company.findMany({ where: { id: { in: [...ids] } } });
      const map = indexById(rows);
      return ids.map((id) => (map.get(id) as Company) ?? null);
    }),

    locationById: new DataLoader<string, Location | null>(async (ids) => {
      const rows = await prisma.location.findMany({ where: { id: { in: [...ids] } } });
      const map = indexById(rows);
      return ids.map((id) => (map.get(id) as Location) ?? null);
    }),

    // Keyed by Profile.id (used by financial types: StarsTransaction, MoneyTransaction, Purchase)
    profileById: new DataLoader<string, Profile | null>(async (ids) => {
      const rows = await prisma.profile.findMany({ where: { id: { in: [...ids] } } });
      const map = indexById(rows);
      return ids.map((id) => (map.get(id) as Profile) ?? null);
    }),

    // Keyed by User.id (used by User.profile field resolver)
    profileByUserId: new DataLoader<string, Profile | null>(async (userIds) => {
      const rows = await prisma.profile.findMany({ where: { userId: { in: [...userIds] } } });
      const map = indexById(rows, "userId");
      return userIds.map((id) => (map.get(id) as Profile) ?? null);
    }),

    memberById: new DataLoader<string, Member | null>(async (ids) => {
      const rows = await prisma.member.findMany({ where: { id: { in: [...ids] } } });
      const map = indexById(rows);
      return ids.map((id) => (map.get(id) as Member) ?? null);
    }),

    gigById: new DataLoader<string, Gig | null>(async (ids) => {
      const rows = await prisma.gig.findMany({ where: { id: { in: [...ids] } } });
      const map = indexById(rows);
      return ids.map((id) => (map.get(id) as Gig) ?? null);
    }),

    assignmentById: new DataLoader<string, GigAssignment | null>(async (ids) => {
      const rows = await prisma.gigAssignment.findMany({ where: { id: { in: [...ids] } } });
      const map = indexById(rows);
      return ids.map((id) => (map.get(id) as GigAssignment) ?? null);
    }),

    // GigReview has a unique constraint on assignmentId
    reviewByAssignmentId: new DataLoader<string, GigReview | null>(async (assignmentIds) => {
      const rows = await prisma.gigReview.findMany({
        where: { assignmentId: { in: [...assignmentIds] } },
      });
      const map = indexById(rows, "assignmentId");
      return assignmentIds.map((id) => (map.get(id) as GigReview) ?? null);
    }),

    productById: new DataLoader<string, Product | null>(async (ids) => {
      const rows = await prisma.product.findMany({ where: { id: { in: [...ids] } } });
      const map = indexById(rows);
      return ids.map((id) => (map.get(id) as Product) ?? null);
    }),

    // ── One-to-many loaders (batch by foreign key, return arrays) ────────────

    membersByCompanyId: new DataLoader<string, Member[]>(async (companyIds) => {
      const rows = await prisma.member.findMany({
        where: { companyId: { in: [...companyIds] } },
        orderBy: { createdAt: "asc" },
      });
      const groups = groupBy(rows, "companyId");
      return companyIds.map((id) => (groups.get(id) as Member[]) ?? []);
    }),

    gigsByCompanyId: new DataLoader<string, Gig[]>(async (companyIds) => {
      const rows = await prisma.gig.findMany({
        where: { companyId: { in: [...companyIds] } },
        orderBy: { createdAt: "desc" },
      });
      const groups = groupBy(rows, "companyId");
      return companyIds.map((id) => (groups.get(id) as Gig[]) ?? []);
    }),

    membersByUserId: new DataLoader<string, Member[]>(async (userIds) => {
      const rows = await prisma.member.findMany({
        where: { userId: { in: [...userIds] } },
        orderBy: { createdAt: "asc" },
      });
      const groups = groupBy(rows, "userId");
      return userIds.map((id) => (groups.get(id) as Member[]) ?? []);
    }),

    assignmentsByGigId: new DataLoader<string, GigAssignment[]>(async (gigIds) => {
      const rows = await prisma.gigAssignment.findMany({
        where: { gigId: { in: [...gigIds] } },
        orderBy: { createdAt: "desc" },
      });
      const groups = groupBy(rows, "gigId");
      return gigIds.map((id) => (groups.get(id) as GigAssignment[]) ?? []);
    }),

    purchasesByAssignmentId: new DataLoader<string, Purchase[]>(async (assignmentIds) => {
      const rows = await prisma.purchase.findMany({
        where: { appliedToAssignmentId: { in: [...assignmentIds] } },
        orderBy: { createdAt: "desc" },
      });
      const groups = groupBy(rows, "appliedToAssignmentId");
      return assignmentIds.map((id) => (groups.get(id) as Purchase[]) ?? []);
    }),
  };
}
