import { cn } from "@/lib/utils";

describe("cn utility function", () => {
  it("should merge class names", () => {
    const result = cn("class1", "class2");
    expect(result).toBe("class1 class2");
  });

  it("should handle conditional classes", () => {
    const isActive = true;
    const result = cn("base", isActive && "active");
    expect(result).toBe("base active");
  });

  it("should filter out falsy values", () => {
    const result = cn("base", false && "hidden", undefined, null, "visible");
    expect(result).toBe("base visible");
  });

  it("should merge tailwind classes correctly", () => {
    // tailwind-merge should handle conflicting classes
    const result = cn("px-4", "px-2");
    expect(result).toBe("px-2"); // Later class wins
  });

  it("should handle empty inputs", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("should handle arrays of classes", () => {
    const result = cn(["class1", "class2"]);
    expect(result).toContain("class1");
    expect(result).toContain("class2");
  });

  it("should handle objects with boolean values", () => {
    const result = cn({
      base: true,
      active: true,
      disabled: false,
    });
    expect(result).toContain("base");
    expect(result).toContain("active");
    expect(result).not.toContain("disabled");
  });
});
