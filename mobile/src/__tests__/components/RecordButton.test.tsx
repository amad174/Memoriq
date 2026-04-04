import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { RecordButton } from "../../components/RecordButton";

describe("RecordButton", () => {
  it("shows 'Tap to record' when idle", () => {
    const { getByText } = render(
      <RecordButton isRecording={false} onPress={() => {}} />
    );
    expect(getByText("Tap to record")).toBeTruthy();
  });

  it("shows duration when recording", () => {
    const { getByText } = render(
      <RecordButton isRecording={true} onPress={() => {}} durationMs={65000} />
    );
    expect(getByText("1:05")).toBeTruthy();
  });

  it("shows uploading state", () => {
    const { getByText } = render(
      <RecordButton isRecording={false} isUploading={true} onPress={() => {}} />
    );
    expect(getByText("Saving note...")).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <RecordButton isRecording={false} onPress={onPress} />
    );
    fireEvent.press(getByTestId("record-button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
