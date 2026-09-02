import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const showSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().default(""),
  images: z.array(z.string()).default([]),
  fullFeeAmount: z.number().default(550),
  enablePinellasCounty: z.boolean().default(true),
  enableHillsboroughCounty: z.boolean().default(true),
  enableManateeCounty: z.boolean().default(true),
  enableIndependentPrivate: z.boolean().default(true),
  enablePwyw: z.boolean().default(true),
  amStartTime: z.string().default("08:00"),
  amEndTime: z.string().default("12:00"),
  pmStartTime: z.string().default("12:00"),
  pmEndTime: z.string().default("16:00"),
  maxStudents: z.number().int().positive().default(200),
  doubleBookingDiscountPercent: z.number().int().min(0).max(100).default(0),
  questions: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        type: z.enum(["TEXT", "RADIO", "CHECKBOX", "SELECT"]),
        options: z.array(z.string()).default([]),
        isRequired: z.boolean().default(false),
        order: z.number().default(0),
      })
    )
    .default([]),
});

async function requireAdmin() {
  const session = await auth();
  if (!session) return false;
  return true;
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data = showSchema.parse(body);

  if (data.id) {
    // Update existing show
    await prisma.$transaction(
      async (tx) => {
        await tx.show.update({
          where: { id: data.id },
          data: {
            title: data.title,
            description: data.description,
            images: data.images,
            fullFeeAmount: data.fullFeeAmount,
            enablePinellasCounty: data.enablePinellasCounty,
            enableHillsboroughCounty: data.enableHillsboroughCounty,
            enableManateeCounty: data.enableManateeCounty,
            enableIndependentPrivate: data.enableIndependentPrivate,
            enablePwyw: data.enablePwyw,
            amStartTime: data.amStartTime,
            amEndTime: data.amEndTime,
            pmStartTime: data.pmStartTime,
            pmEndTime: data.pmEndTime,
            maxStudents: data.maxStudents,
            doubleBookingDiscountPercent: data.doubleBookingDiscountPercent,
          },
        });

        // Delete removed questions and upsert existing ones
        const incomingIds = data.questions.map((q) => q.id);
        await tx.customQuestion.deleteMany({
          where: { showId: data.id, id: { notIn: incomingIds } },
        });

        for (const q of data.questions) {
          await tx.customQuestion.upsert({
            where: { id: q.id },
            create: {
              id: q.id,
              showId: data.id!,
              text: q.text,
              type: q.type,
              options: q.options,
              isRequired: q.isRequired,
              order: q.order,
            },
            update: {
              text: q.text,
              type: q.type,
              options: q.options,
              isRequired: q.isRequired,
              order: q.order,
            },
          });
        }
      },
      { maxWait: 10000, timeout: 20000 }
    );

    return NextResponse.json({ success: true });
  } else {
    // Deactivate any current active show
    await prisma.show.updateMany({ data: { isActive: false } });

    const show = await prisma.show.create({
      data: {
        title: data.title,
        description: data.description,
        images: data.images,
        fullFeeAmount: data.fullFeeAmount,
        enablePinellasCounty: data.enablePinellasCounty,
        enableHillsboroughCounty: data.enableHillsboroughCounty,
        enableIndependentPrivate: data.enableIndependentPrivate,
        enablePwyw: data.enablePwyw,
        amStartTime: data.amStartTime,
        amEndTime: data.amEndTime,
        pmStartTime: data.pmStartTime,
        pmEndTime: data.pmEndTime,
        maxStudents: data.maxStudents,
        doubleBookingDiscountPercent: data.doubleBookingDiscountPercent,
        isActive: true,
        customQuestions: {
          create: data.questions.map((q) => ({
            id: q.id,
            text: q.text,
            type: q.type,
            options: q.options,
            isRequired: q.isRequired,
            order: q.order,
          })),
        },
      },
    });

    return NextResponse.json({ id: show.id });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.show.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
