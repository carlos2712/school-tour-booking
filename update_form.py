import re

file_path = "/Users/carlosorjuela/repos/school-tour-booking/components/booking-form-wrapper.tsx"

with open(file_path, "r") as f:
    content = f.read()

# 1. Update Performance interface
content = content.replace(
    "preferredAlternateDate?: string;",
    "preferredAlternateDate?: string;\n  customTime?: string;"
)

# 2. Update text colors
content = content.replace('text-white', 'text-foreground')
content = content.replace('text-gray-300', 'text-gray-600')
content = content.replace('text-gray-400', 'text-gray-500')
content = content.replace('border-navy-light', 'border-gray-200')
content = content.replace('bg-navy-light', 'bg-gray-100')
content = content.replace('bg-navy-card', 'bg-gray-50')
content = content.replace('text-amber-300', 'text-amber-700')

# 3. Update getSlotsForDate disabled condition
content = content.replace(
    '(day: Date) =>\n                          getSlotsForDate(format(day, "yyyy-MM-dd")).length === 0,',
    '(day: Date) =>\n                          getSlotsForDate(format(day, "yyyy-MM-dd")).length < (sameDay ? 2 : 1),'
)

# 4. Hide slot picker for sameDay
content = content.replace(
    '{selectedDateStr && slots.length > 1 && (',
    '{!sameDay && selectedDateStr && slots.length > 1 && ('
)
content = content.replace(
    '{selectedDateStr && slots.length === 1 && (',
    '{!sameDay && selectedDateStr && slots.length === 1 && ('
)

# 5. Add customTime input
custom_time_jsx = """
                {(sameDay || selectedSlot?.timeSlot === "AM" || (!sameDay && slots.length === 1 && slots[0].timeSlot === "AM")) && selectedDateStr && (
                  <div className="space-y-1.5 mt-4">
                    <Label>Requested AM Start Time *</Label>
                    <Input
                      placeholder="e.g. 9:30 AM"
                      value={performances[perfIndex]?.customTime ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPerformances((prev) => {
                          const updated = [...prev];
                          if (updated[perfIndex]) {
                            updated[perfIndex] = { ...updated[perfIndex]!, customTime: val };
                          }
                          return updated;
                        });
                      }}
                    />
                  </div>
                )}
"""
content = content.replace(
    '{selectedDateStr && slots.length === 0 && (',
    custom_time_jsx + '\n\n                {selectedDateStr && slots.length === 0 && ('
)

# 6. Update performancesValid
new_valid_logic = """
  const performancesValid = performances
    .slice(0, sameDay ? 1 : performanceCount)
    .every((p) => {
       if (!p) return false;
       if (!p.selectedDateStr) return false;
       if (!sameDay && !p.showDateId) return false;
       if (p.venueLocation.trim().length === 0) return false;
       
       const slot = sameDay ? getSlotsForDate(p.selectedDateStr).find(s => s.timeSlot === "AM") : availableDates.find((d) => d.id === p.showDateId);
       if (slot?.timeSlot === "AM" || sameDay) {
         if (!p.customTime || p.customTime.trim().length === 0) return false;
       }
       return true;
    });
"""
content = re.sub(
    r'const performancesValid = performances\s*\.slice\(0, performanceCount\)\s*\.every\(\(p\) => p && p\.showDateId && p\.venueLocation\.trim\(\)\.length > 0\);',
    new_valid_logic,
    content,
    flags=re.MULTILINE
)

# 7. Update Array.from mapping
content = content.replace(
    '{Array.from({ length: performanceCount }).map((_, perfIndex) => {',
    '{Array.from({ length: sameDay ? 1 : performanceCount }).map((_, perfIndex) => {'
)

# 8. Update handleDateSelect
new_handle_date = """  function handleDateSelect(perfIndex: number, day: Date | undefined) {
    if (!day) return;
    const dateStr = format(day, "yyyy-MM-dd");
    const slots = getSlotsForDate(dateStr);

    setPerformances((prev) => {
      const updated = [...prev];
      const venue = updated[perfIndex]?.venueLocation ?? "";
      
      if (sameDay) {
        const amSlot = slots.find(s => s.timeSlot === "AM");
        updated[perfIndex] = {
          selectedDateStr: dateStr,
          showDateId: amSlot ? amSlot.id : "",
          venueLocation: venue,
          customTime: updated[perfIndex]?.customTime,
        };
      } else {
        updated[perfIndex] = {
          selectedDateStr: dateStr,
          showDateId: slots.length === 1 ? slots[0].id : "",
          venueLocation: venue,
          customTime: updated[perfIndex]?.customTime,
        };
      }
      return updated;
    });
  }"""
content = re.sub(
    r'function handleDateSelect\(perfIndex: number, day: Date \| undefined\) \{.*?\n  \}',
    new_handle_date,
    content,
    flags=re.DOTALL
)

# 9. Update submit mapping
new_submit_performances = """          performances: sameDay
            ? [
                {
                  showDateId: getSlotsForDate(performances[0]!.selectedDateStr).find(s => s.timeSlot === "AM")?.id ?? "",
                  venueLocation: performances[0]!.venueLocation,
                  customTime: performances[0]!.customTime,
                },
                {
                  showDateId: getSlotsForDate(performances[0]!.selectedDateStr).find(s => s.timeSlot === "PM")?.id ?? "",
                  venueLocation: performances[0]!.venueLocation,
                }
              ]
            : performances.slice(0, performanceCount).map((p) => ({
                showDateId: p!.showDateId,
                venueLocation: p!.venueLocation,
                preferredAlternateDate: p!.preferredAlternateDate,
                customTime: p!.customTime,
              })),"""

content = re.sub(
    r'performances: performances\.slice\(0, performanceCount\)\.map\(\(p\) => \(\{.*?\n\s*\}\)\),',
    new_submit_performances,
    content,
    flags=re.DOTALL
)

# 10. Update Review step display for sameDay
review_performances = """              {sameDay ? (
                <div className="mb-3 text-sm">
                  <p className="font-medium text-foreground">Both AM & PM Performances</p>
                  {performances[0]?.selectedDateStr && (
                    <p className="text-gray-600">
                      {format(parseISO(performances[0].selectedDateStr), "EEEE, MMMM d, yyyy")}
                    </p>
                  )}
                  <p className="text-gray-600">AM Time: {performances[0]?.customTime}</p>
                  <p className="text-gray-600">Venue: {performances[0]?.venueLocation}</p>
                </div>
              ) : performances.slice(0, performanceCount).map((p, i) => {"""
content = content.replace('{performances.slice(0, performanceCount).map((p, i) => {', review_performances)
content = content.replace('Venue: {p?.venueLocation}</p>\n                  </div>\n                );\n              })}</div>', 'Venue: {p?.venueLocation}</p>\n                  </div>\n                );\n              })}\n              </div>')


with open(file_path, "w") as f:
    f.write(content)
print("Updated successfully")
