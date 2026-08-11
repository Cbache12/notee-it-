import { prisma } from "@/lib/prisma";

const GOAL_ID = "singleton";

export function getGoal() {
  return prisma.goal.findUnique({ where: { id: GOAL_ID } });
}

export function upsertGoal(data: {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  startWeightKg?: number;
  goalWeightKg?: number;
  planWeeks?: number;
}) {
  return prisma.goal.upsert({
    where: { id: GOAL_ID },
    create: { id: GOAL_ID, ...data },
    update: data,
  });
}
