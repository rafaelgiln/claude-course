import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge, getToolLabel } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

// --- getToolLabel unit tests ---

test("str_replace_editor create → Creating <filename>", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "/App.jsx" })).toBe("Creating App.jsx");
});

test("str_replace_editor str_replace → Editing <filename>", () => {
  expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "/src/Card.jsx" })).toBe("Editing Card.jsx");
});

test("str_replace_editor insert → Editing <filename>", () => {
  expect(getToolLabel("str_replace_editor", { command: "insert", path: "/utils.ts" })).toBe("Editing utils.ts");
});

test("str_replace_editor view → Reading <filename>", () => {
  expect(getToolLabel("str_replace_editor", { command: "view", path: "/index.tsx" })).toBe("Reading index.tsx");
});

test("str_replace_editor unknown command → Editing <filename>", () => {
  expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" })).toBe("Editing App.jsx");
});

test("file_manager rename → Renaming <filename>", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" })).toBe("Renaming old.jsx");
});

test("file_manager delete → Deleting <filename>", () => {
  expect(getToolLabel("file_manager", { command: "delete", path: "/temp.js" })).toBe("Deleting temp.js");
});

test("unknown tool → returns tool name as-is", () => {
  expect(getToolLabel("some_other_tool", { command: "run" })).toBe("some_other_tool");
});

test("missing path → returns generic fallback label", () => {
  expect(getToolLabel("str_replace_editor", { command: "create" })).toBe("Creating file");
});

test("nested path → extracts only the filename", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "/src/components/Button.tsx" })).toBe("Creating Button.tsx");
});

// --- ToolInvocationBadge render tests ---

test("shows loading spinner when state is 'call'", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="call"
    />
  );
  expect(screen.getByTestId("loading-indicator")).toBeDefined();
  expect(screen.queryByTestId("done-indicator")).toBeNull();
});

test("shows loading spinner when state is 'partial-call'", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="partial-call"
    />
  );
  expect(screen.getByTestId("loading-indicator")).toBeDefined();
  expect(screen.queryByTestId("done-indicator")).toBeNull();
});

test("shows green dot when state is 'result'", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="result"
    />
  );
  expect(screen.getByTestId("done-indicator")).toBeDefined();
  expect(screen.queryByTestId("loading-indicator")).toBeNull();
});

test("renders user-friendly label text", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("renders file_manager delete label", () => {
  render(
    <ToolInvocationBadge
      toolName="file_manager"
      args={{ command: "delete", path: "/old-component.tsx" }}
      state="result"
    />
  );
  expect(screen.getByText("Deleting old-component.tsx")).toBeDefined();
});
