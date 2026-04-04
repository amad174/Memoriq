import { formatDuration, toISODate, formatTime } from "../../utils/formatDate";

describe("formatDuration", () => {
  it("returns empty string for null", () => {
    expect(formatDuration(null)).toBe("");
  });

  it("formats seconds under a minute", () => {
    expect(formatDuration(45)).toBe("0:45");
  });

  it("formats exactly one minute", () => {
    expect(formatDuration(60)).toBe("1:00");
  });

  it("formats 90 seconds", () => {
    expect(formatDuration(90)).toBe("1:30");
  });

  it("pads single-digit seconds", () => {
    expect(formatDuration(65)).toBe("1:05");
  });

  it("returns empty string for 0", () => {
    expect(formatDuration(0)).toBe("");
  });
});

describe("toISODate", () => {
  it("returns YYYY-MM-DD format", () => {
    const result = toISODate(new Date("2026-04-15T12:00:00Z"));
    expect(result).toBe("2026-04-15");
  });
});

describe("formatTime", () => {
  it("returns HH:MM formatted string", () => {
    const result = formatTime("2026-04-15T09:05:00.000Z");
    // Just check that it matches HH:MM pattern
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });
});
