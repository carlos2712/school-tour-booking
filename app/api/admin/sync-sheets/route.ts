import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { syncBookingsToGoogleSheets } from "@/lib/sheets";

async function requireAdmin() {
  const session = await auth();
  if (!session) return false;
  return true;
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, spreadsheetId } = body;

    // 1. Save spreadsheet ID if provided
    if (spreadsheetId !== undefined) {
      await prisma.setting.upsert({
        where: { key: "google_spreadsheet_id" },
        update: { value: spreadsheetId.trim() },
        create: { key: "google_spreadsheet_id", value: spreadsheetId.trim() },
      });
    }

    // 2. Perform synchronization if action is "sync"
    if (action === "sync") {
      const result = await syncBookingsToGoogleSheets();

      // Log the last sync timestamp
      const now = new Date().toISOString();
      await prisma.setting.upsert({
        where: { key: "last_google_sheets_sync" },
        update: { value: now },
        create: { key: "last_google_sheets_sync", value: now },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully synchronized ${result.rowsSynced} performance rows to Google Sheets.`,
        rowsSynced: result.rowsSynced,
        lastSyncedAt: now,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Google Sheets settings saved successfully.",
    });
  } catch (error: any) {
    console.error("Google Sheets Synchronization Error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred during synchronization." },
      { status: 500 }
    );
  }
}
