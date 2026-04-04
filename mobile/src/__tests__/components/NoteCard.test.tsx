import React from "react";
import { render } from "@testing-library/react-native";
import { NoteCard } from "../../components/NoteCard";
import { NoteListItem } from "../../types/note";

// Mock expo-router
jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

const baseNote: NoteListItem = {
  id: "note-123",
  title: "Test note title",
  summary: "This is a test summary.",
  tags: ["work", "planning"],
  duration_seconds: 90,
  transcription_status: "done",
  day_date: "2026-04-15",
  recorded_at: "2026-04-15T09:00:00.000Z",
  audio_url: "/audio/test.m4a",
};

describe("NoteCard", () => {
  it("renders the note title", () => {
    const { getByText } = render(<NoteCard note={baseNote} />);
    expect(getByText("Test note title")).toBeTruthy();
  });

  it("renders the summary", () => {
    const { getByText } = render(<NoteCard note={baseNote} />);
    expect(getByText("This is a test summary.")).toBeTruthy();
  });

  it("renders tags", () => {
    const { getByText } = render(<NoteCard note={baseNote} />);
    expect(getByText("work")).toBeTruthy();
    expect(getByText("planning")).toBeTruthy();
  });

  it("shows 'Untitled note' when title is null", () => {
    const { getByText } = render(<NoteCard note={{ ...baseNote, title: null }} />);
    expect(getByText("Untitled note")).toBeTruthy();
  });

  it("shows transcription status when not done", () => {
    const { getByText } = render(
      <NoteCard note={{ ...baseNote, transcription_status: "processing", summary: null }} />
    );
    expect(getByText("Transcribing...")).toBeTruthy();
  });

  it("shows failed message when transcription failed", () => {
    const { getByText } = render(
      <NoteCard note={{ ...baseNote, transcription_status: "failed", summary: null }} />
    );
    expect(getByText("Transcription failed")).toBeTruthy();
  });

  it("shows date when showDate is true", () => {
    const { getByText } = render(<NoteCard note={baseNote} showDate />);
    expect(getByText(/2026-04-15/)).toBeTruthy();
  });
});
