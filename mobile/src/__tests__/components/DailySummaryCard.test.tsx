import React from "react";
import { render } from "@testing-library/react-native";
import { DailySummaryCard } from "../../components/DailySummaryCard";
import { DailySummary } from "../../types/calendar";

const mockSummary: DailySummary = {
  id: "sum-1",
  user_id: "user-1",
  day_date: "2026-04-15",
  summary: "A productive day with lots of planning.",
  key_topics: ["work", "planning"],
  action_items: ["Send email to Sarah", "Update CV"],
  mood: "focused",
  created_at: "2026-04-15T23:00:00.000Z",
};

describe("DailySummaryCard", () => {
  it("renders summary text", () => {
    const { getByText } = render(<DailySummaryCard summary={mockSummary} />);
    expect(getByText("A productive day with lots of planning.")).toBeTruthy();
  });

  it("renders key topics", () => {
    const { getByText } = render(<DailySummaryCard summary={mockSummary} />);
    expect(getByText("work")).toBeTruthy();
    expect(getByText("planning")).toBeTruthy();
  });

  it("renders action items", () => {
    const { getByText } = render(<DailySummaryCard summary={mockSummary} />);
    expect(getByText("· Send email to Sarah")).toBeTruthy();
  });

  it("renders mood badge", () => {
    const { getByText } = render(<DailySummaryCard summary={mockSummary} />);
    expect(getByText("focused")).toBeTruthy();
  });

  it("shows loading state", () => {
    const { getByText } = render(<DailySummaryCard summary={null} isLoading />);
    expect(getByText("Generating daily summary...")).toBeTruthy();
  });

  it("shows placeholder when no summary", () => {
    const { getByText } = render(<DailySummaryCard summary={null} />);
    expect(getByText("No summary yet.")).toBeTruthy();
  });
});
