import { prisma } from "@/lib/prisma";
import { canViewAllData, type PermissionUser } from "@/permissions";
import { periodWhere, reportPeriod, type ReportSearchParams } from "./common";

export async function getEmployeeActivityReport(params: ReportSearchParams, user: PermissionUser) {
  const { from, to } = reportPeriod(params);
  const visibleUsers = await prisma.user.findMany({
    where: {
      isActive: true,
      ...(canViewAllData(user)
        ? {
            ...(params.responsibleId ? { id: params.responsibleId } : {}),
            ...(params.role ? { role: params.role as never } : {})
          }
        : { id: user.id })
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true }
  });

  const rows = await Promise.all(
    visibleUsers.map(async (employee) => {
      const own = { OR: [{ responsibleId: employee.id }, { createdById: employee.id }] };
      const actionFilter = params.actionType ? { actionType: params.actionType as never } : {};
      const [clients, designers, objects, deals, proposals, proposalAmount, tasks, doneTasks, taskRows, touches, calls, meetings, email, messengers, followUps, presentations, outsideMeetings] = await Promise.all([
        prisma.client.count({ where: { AND: [own, { createdAt: periodWhere(from, to) }] } }),
        prisma.designer.count({ where: { AND: [own, { createdAt: periodWhere(from, to) }] } }),
        prisma.projectObject.count({ where: { AND: [own, { createdAt: periodWhere(from, to) }] } }),
        prisma.deal.count({ where: { AND: [own, { createdAt: periodWhere(from, to) }] } }),
        prisma.commercialProposal.count({ where: { AND: [own, { createdAt: periodWhere(from, to) }] } }),
        prisma.commercialProposal.aggregate({ where: { AND: [own, { createdAt: periodWhere(from, to) }] }, _sum: { amount: true } }),
        prisma.taskActivity.count({ where: { responsibleId: employee.id, recordType: "TASK", createdAt: periodWhere(from, to), ...actionFilter } }),
        prisma.taskActivity.count({ where: { responsibleId: employee.id, recordType: "TASK", status: "DONE", completedAt: periodWhere(from, to), ...actionFilter } }),
        prisma.taskActivity.findMany({ where: { responsibleId: employee.id, recordType: "TASK", dueAt: { lt: new Date() }, status: { notIn: ["DONE", "CANCELLED", "CLOSED"] }, ...actionFilter }, select: { id: true } }),
        prisma.taskActivity.count({ where: { responsibleId: employee.id, recordType: "TOUCH", completedAt: periodWhere(from, to), ...actionFilter } }),
        prisma.taskActivity.count({ where: { responsibleId: employee.id, actionType: { in: ["CALL", "INCOMING_CALL"] }, createdAt: periodWhere(from, to) } }),
        prisma.taskActivity.count({ where: { responsibleId: employee.id, actionType: { in: ["SHOWROOM_MEETING", "OUTSIDE_MEETING"] }, createdAt: periodWhere(from, to) } }),
        prisma.taskActivity.count({ where: { responsibleId: employee.id, actionType: "EMAIL", createdAt: periodWhere(from, to) } }),
        prisma.taskActivity.count({ where: { responsibleId: employee.id, actionType: { in: ["WHATSAPP", "TELEGRAM"] }, createdAt: periodWhere(from, to) } }),
        prisma.taskActivity.count({ where: { responsibleId: employee.id, actionType: "FOLLOW_UP", createdAt: periodWhere(from, to) } }),
        prisma.taskActivity.count({ where: { responsibleId: employee.id, actionType: "PRESENTATION", createdAt: periodWhere(from, to) } }),
        prisma.taskActivity.count({ where: { responsibleId: employee.id, actionType: "OUTSIDE_MEETING", createdAt: periodWhere(from, to) } })
      ]);

      return {
        employee,
        clients,
        designers,
        objects,
        deals,
        proposals,
        proposalAmount: proposalAmount._sum.amount ?? 0,
        tasks,
        doneTasks,
        overdueTasks: taskRows.length,
        touches,
        calls,
        meetings,
        email,
        messengers,
        followUps,
        presentations,
        outsideMeetings
      };
    })
  );

  return { period: { from, to }, rows };
}
