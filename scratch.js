const show = {
  amStartTime: "08:00",
  amEndTime: "11:00",
  pmStartTime: "13:00",
  pmEndTime: "15:00"
};

const p = {
  selectedDateStr: "2026-05-15",
  showDateId: "mock_id",
  venueLocation: "School",
  studentCount: "50",
  customTime: "07:30", // INvalid!
  pmCustomTime: ""
};

const slot = { timeSlot: "AM" };
const sameDay = false;

let valid = true;
if (slot?.timeSlot === "AM" || sameDay) {
  if (!p.customTime || p.customTime.trim().length === 0) valid = false;
  if (p.customTime < show.amStartTime || p.customTime > show.amEndTime) valid = false;
}

if (sameDay || slot?.timeSlot === "PM") {
  if (!p.pmCustomTime || p.pmCustomTime.trim().length === 0) valid = false;
  if (p.pmCustomTime < show.pmStartTime || p.pmCustomTime > show.pmEndTime) valid = false;
}

console.log("Valid:", valid);
