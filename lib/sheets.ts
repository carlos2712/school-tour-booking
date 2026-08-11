import { google } from "googleapis";
import { prisma } from "./prisma";
import { format } from "date-fns";

export async function syncBookingsToGoogleSheets() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !privateKey) {
    throw new Error(
      "Missing Google Service Account credentials. Please configure GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in your environment."
    );
  }

  // Retrieve the target spreadsheet ID from the database
  const spreadsheetIdSetting = await prisma.setting.findUnique({
    where: { key: "google_spreadsheet_id" },
  });

  const spreadsheetId = spreadsheetIdSetting?.value;
  if (!spreadsheetId) {
    throw new Error(
      "Google Spreadsheet ID has not been configured yet. Please configure it in the settings below."
    );
  }

  // Initialize JWT client for Google Service Account authentication
  const authClient = new google.auth.JWT({
    email,
    key: privateKey.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  // Authenticate
  await authClient.authorize();

  const sheets = google.sheets({ version: "v4", auth: authClient });

  // Query all bookings ordered by creation date ascending
  const bookings = await prisma.booking.findMany({
    where: { deletedAt: null },
    include: {
      show: { select: { title: true } },
      performances: {
        include: { showDate: true },
        orderBy: { showDate: { date: "asc" } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Table header column names
  const headers = [
    "Booking ID",
    "School Name",
    "Contact Name",
    "Email",
    "Phone",
    "Grades",
    "Show Title",
    "Booking Status",
    "Payment Option",
    "Payment Amount",
    "Special Notes",
    "Custom Answers",
    "Performance Slot",
    "Performance Date",
    "Time Slot",
    "Student Count",
    "Venue Location",
    "Preferred Alternate Date",
    "Custom Time",
    "Booked At",
  ];

  const rows: any[][] = [headers];

  for (const booking of bookings) {
    // Format custom questions & answers as clean multi-line text in a single cell
    let customAnswersText = "";
    if (booking.customAnswers && typeof booking.customAnswers === "object") {
      customAnswersText = Object.entries(booking.customAnswers)
        .map(([question, answer]) => {
          const answerStr = Array.isArray(answer) ? answer.join(", ") : String(answer);
          return `${question}: ${answerStr}`;
        })
        .join("\n");
    }

    const baseData = [
      booking.id,
      booking.schoolName,
      booking.contactName,
      booking.email,
      booking.phone,
      booking.grades,
      booking.show.title,
      booking.status,
      booking.paymentOption,
      booking.paymentAmount !== null && booking.paymentAmount !== undefined
        ? `$${booking.paymentAmount}`
        : "",
      booking.notes || "",
      customAnswersText,
    ];

    if (booking.performances.length === 0) {
      // If no performance records exist, write a single row with blank performance data
      rows.push([
        ...baseData,
        "N/A", // Performance Slot
        "", // Performance Date
        "", // Time Slot
        "", // Student Count
        "", // Venue Location
        "", // Preferred Alternate Date
        "", // Custom Time
        format(new Date(booking.createdAt), "yyyy-MM-dd HH:mm:ss"),
      ]);
    } else {
      // Flatten performances so each performance is represented on its own row
      booking.performances.forEach((perf, index) => {
        const slotLabel = `${index + 1} of ${booking.performances.length}`;
        const perfDate = format(new Date(perf.showDate.date), "yyyy-MM-dd");
        const altDate = perf.preferredAlternateDate
          ? format(new Date(perf.preferredAlternateDate), "yyyy-MM-dd")
          : "";

        rows.push([
          ...baseData,
          slotLabel,
          perfDate,
          perf.showDate.timeSlot,
          perf.studentCount,
          perf.venueLocation,
          altDate,
          perf.customTime || "",
          format(new Date(booking.createdAt), "yyyy-MM-dd HH:mm:ss"),
        ]);
      });
    }
  }

  let sheetName = "Bookings";

  // Check if "Bookings" sheet exists, and create it if it doesn't
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetsList = meta.data.sheets || [];
    const sheetExists = sheetsList.some((s) => s.properties?.title === sheetName);

    if (!sheetExists) {
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheetName,
                    gridProperties: {
                      rowCount: 1000,
                      columnCount: headers.length,
                      frozenRowCount: 1, // Freeze header row
                    },
                  },
                },
              },
            ],
          },
        });
      } catch (addError) {
        console.warn("Could not create 'Bookings' sheet, falling back to first sheet.", addError);
        sheetName = sheetsList[0]?.properties?.title || "Sheet1";
      }
    }
  } catch (metaError) {
    console.warn(
      "Could not retrieve spreadsheet metadata. Attempting to sync to 'Sheet1' range directly.",
      metaError
    );
    sheetName = "Sheet1";
  }

  // Clear existing cells in the sheet to prevent trailing rows from older synchronizations
  try {
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${sheetName}!A1:Z`,
    });
  } catch (clearError) {
    console.warn("Failed to clear sheet values. Continuing to update values...", clearError);
  }

  // Write the table rows starting from A1
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "RAW",
    requestBody: {
      values: rows,
    },
  });

  return {
    rowsSynced: rows.length - 1, // Exclude headers row
    spreadsheetId,
  };
}
