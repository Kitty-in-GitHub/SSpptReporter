import { describe, expect, it } from "vitest";
import {
  normalizeEmphasisRanges,
  resolveVoiceDirective,
  splitUtteranceByEmphasis,
} from "./voice-directive.js";
import type { DirectorAction } from "./types.js";
import {
  DEFAULT_PERFORMANCE_CATALOG,
  resolveBeatPerformance,
} from "./performance-profile.js";

describe("splitUtteranceByEmphasis", () => {
  it("returns single segment when no emphasis", () => {
    expect(splitUtteranceByEmphasis("你好世界", undefined)).toEqual([
      { text: "你好世界", emphasized: false },
    ]);
  });

  it("splits emphasized spans", () => {
    const text = "本页介绍系统架构与性能指标。";
    const segments = splitUtteranceByEmphasis(text, [
      [2, 6],
      [9, 11],
    ]);
    expect(segments).toEqual([
      { text: "本页", emphasized: false },
      { text: "介绍系统", emphasized: true },
      { text: "架构与", emphasized: false },
      { text: "性能", emphasized: true },
      { text: "指标。", emphasized: false },
    ]);
  });

  it("merges overlapping emphasis ranges", () => {
    expect(
      normalizeEmphasisRanges("abcdef", [
        [1, 4],
        [3, 5],
      ]),
    ).toEqual([[1, 5]]);
  });
});

describe("resolveVoiceDirective", () => {
  it("merges profile voice with action emphasis", () => {
    const action: DirectorAction = {
      schema_version: "1.0",
      mode: "present",
      utterance: "测试",
      profile: "emphatic",
      emphasis: [[0, 2]],
      voice: { speed: 1.1 },
    };
    const resolved = resolveBeatPerformance(action, DEFAULT_PERFORMANCE_CATALOG);
    const directive = resolveVoiceDirective(action, resolved);

    expect(directive.speaker).toBe("zh-CN-YunxiNeural");
    expect(directive.rate).toBe(1.1);
    expect(directive.emphasis).toEqual([[0, 2]]);
  });
});
