import { describe, it, expect } from "vitest";
import { generateAIQuiz } from "../lib/api";

describe("Phase 4 Assessment: Question Generation & Flagging", () => {
  it("generates topic-specific questions when requested", async () => {
    const psychQuestions = await generateAIQuiz({
      subject: "Psychiatric",
      topic: "Defense Mechanisms",
      difficulty: "Foundation",
      count: 2,
    });

    expect(psychQuestions.length).toBe(2);
    expect(psychQuestions[0].subject).toBe("Psychiatric");
    expect(psychQuestions[0].topic).toBe("Defense Mechanisms");
    expect(psychQuestions[0].options.length).toBe(4);
    expect(psychQuestions[0].rationale).toBeDefined();
  }, 15000);

  it("changes topic questions when selecting different topic", async () => {
    const medSurgQuestions = await generateAIQuiz({
      subject: "Med-Surg",
      topic: "ABG Interpretation",
      difficulty: "Hard NGN",
      count: 2,
    });

    expect(medSurgQuestions[0].subject).toBe("Med-Surg");
    expect(medSurgQuestions[0].topic).toBe("ABG Interpretation");
  }, 15000);

  it("handles toggling flags correctly", () => {
    let flagged: string[] = [];
    const toggle = (id: string) => {
      flagged = flagged.includes(id) ? flagged.filter((x) => x !== id) : [...flagged, id];
    };

    toggle("q-1");
    expect(flagged).toEqual(["q-1"]);

    toggle("q-2");
    expect(flagged).toEqual(["q-1", "q-2"]);

    toggle("q-1");
    expect(flagged).toEqual(["q-2"]);
  });
});
