import { render, screen } from "@testing-library/react";
import { Sidebar } from "@/components/layout/sidebar";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

// Mock next/link
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe("Sidebar Component", () => {
  it("should render the app title", () => {
    render(<Sidebar />);
    expect(screen.getByText("LaxPlan")).toBeInTheDocument();
  });

  it("should render all navigation links", () => {
    render(<Sidebar />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Teams")).toBeInTheDocument();
    expect(screen.getByText("Fields")).toBeInTheDocument();
    expect(screen.getByText("Dates & Times")).toBeInTheDocument();
    expect(screen.getByText("Games")).toBeInTheDocument();
    expect(screen.getByText("Weekly Schedule")).toBeInTheDocument();
    expect(screen.getByText("Email Coaches")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("should have correct href for each link", () => {
    render(<Sidebar />);

    expect(screen.getByText("Dashboard").closest("a")).toHaveAttribute("href", "/");
    expect(screen.getByText("Teams").closest("a")).toHaveAttribute("href", "/teams");
    expect(screen.getByText("Fields").closest("a")).toHaveAttribute("href", "/fields");
    expect(screen.getByText("Dates & Times").closest("a")).toHaveAttribute("href", "/dates");
    expect(screen.getByText("Games").closest("a")).toHaveAttribute("href", "/games");
    expect(screen.getByText("Weekly Schedule").closest("a")).toHaveAttribute("href", "/schedule");
    expect(screen.getByText("Email Coaches").closest("a")).toHaveAttribute("href", "/email");
    expect(screen.getByText("Settings").closest("a")).toHaveAttribute("href", "/settings");
  });
});
