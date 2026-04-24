import { prisma } from "@/lib/prisma";
import { ShowForm } from "./show-form";

export const dynamic = "force-dynamic";

export default async function AdminShowPage() {
  const show = await prisma.show.findFirst({
    where: { isActive: true },
    include: { customQuestions: { orderBy: { order: "asc" } } },
  });

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-1">Show Setup</h1>
      <p className="text-gray-400 text-sm mb-8">
        Configure the details of the current school tour show.
      </p>
      <ShowForm show={show} />
    </div>
  );
}
