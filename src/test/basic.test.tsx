import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LoadingSpinner from "../components/LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders with default props", () => {
    render(<LoadingSpinner />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders with custom text", () => {
    render(<LoadingSpinner text="Custom loading text" />);
    expect(screen.getByText("Custom loading text")).toBeInTheDocument();
  });

  it("renders without text when not provided", () => {
    render(<LoadingSpinner text="" />);
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });
});

describe("Basic App Functionality", () => {
  it("environment setup works correctly", () => {
    expect(import.meta.env.VITE_SUPABASE_URL).toBe("https://test.supabase.co");
    expect(import.meta.env.VITE_SUPABASE_ANON_KEY).toBe("test-key");
  });
});
