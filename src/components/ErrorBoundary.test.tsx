import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

// Test fixture: a component that throws on first render only.
let boomCount = 0;
function Boom({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    boomCount += 1;
    throw new Error("kaboom");
  }
  return <div>recovered</div>;
}

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <div>hello</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("renders the default fallback when a child throws and forwards onError", () => {
    const onError = vi.fn();
    // React 18 logs caught errors to console.error; suppress to keep test output clean.
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary onError={onError}>
        <Boom shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    // Try-again + Reload-page buttons present
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reload page/i })).toBeInTheDocument();
    expect(onError).toHaveBeenCalledOnce();
    errSpy.mockRestore();
  });

  it("uses a custom fallback when provided", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary fallback={({ error }) => <div>custom: {error.message}</div>}>
        <Boom shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("custom: kaboom")).toBeInTheDocument();
    errSpy.mockRestore();
  });

  it("hides the fallback after the user clicks Try again (state reset)", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { rerender } = render(
      <ErrorBoundary>
        <Boom shouldThrow={true} />
      </ErrorBoundary>,
    );
    // Fallback is showing
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    // Swap children to a non-throwing tree, then click Try again — boundary
    // clears its error state and re-renders the fresh children.
    rerender(
      <ErrorBoundary>
        <div>healthy</div>
      </ErrorBoundary>,
    );
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(screen.getByText("healthy")).toBeInTheDocument();
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    errSpy.mockRestore();
  });
});

// Suppress unused-variable warning — boomCount is touched by the throw fixture
// but no longer referenced by any test now that we use rerender instead.
void boomCount;
