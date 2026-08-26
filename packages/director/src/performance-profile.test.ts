import { describe, expect, it } from "vitest";
import type { DirectorAction } from "./types.js";
import {
  DEFAULT_PERFORMANCE_CATALOG,
  listSelectableProfiles,
  mergePerformanceCatalogs,
  resolveBeatPerformance,
  sanitizeProfileId,
} from "./performance-profile.js";
import { resolveVoiceDirective } from "./voice-directive.js";

describe("resolveBeatPerformance", () => {
  it("merges profile defaults with action overrides", () => {
    const action: DirectorAction = {
      schema_version: "1.0",
      mode: "present",
      utterance: "测试",
      profile: "confident",
      voice: { speed: 1.1 },
      timing: { pause_after_ms: 100 },
    };

    const resolved = resolveBeatPerformance(action);
    expect(resolved.profileName).toBe("confident");
    expect(resolved.gesture).toBe("explain");
    expect(resolved.voice.speed).toBe(1.1);
    expect(resolved.timing.pause_after_ms).toBe(100);
    expect(resolved.vrmExpression).toBe("happy");
  });

  it("falls back to emotion when profile is missing", () => {
    const action: DirectorAction = {
      schema_version: "1.0",
      mode: "present",
      utterance: "思考",
      emotion: "thinking",
    };

    const resolved = resolveBeatPerformance(action);
    expect(resolved.profileName).toBe("thinking");
    expect(resolved.gesture).toBe("think");
    expect(resolved.voice.speed).toBe(0.88);
  });

  it("merges overlay catalogs", () => {
    const merged = mergePerformanceCatalogs(DEFAULT_PERFORMANCE_CATALOG, {
      profiles: {
        confident: { voice: { speed: 0.8 } },
      },
    });
    const resolved = resolveBeatPerformance(
      {
        schema_version: "1.0",
        mode: "present",
        utterance: "x",
        profile: "confident",
      },
      merged,
    );
    expect(resolved.voice.speed).toBe(0.8);
  });

  it("lists built-in and custom profiles", () => {
    const merged = mergePerformanceCatalogs(DEFAULT_PERFORMANCE_CATALOG, {
      profiles: {
        opening_warm: {
          label: "开场温暖",
          vrm: { expression: "happy" },
        },
      },
    });
    expect(listSelectableProfiles(merged)).toEqual([
      "neutral",
      "confident",
      "friendly",
      "serious",
      "thinking",
      "apologetic",
      "emphatic",
      "opening_warm",
    ]);
    expect(sanitizeProfileId(" Opening-Warm ")).toBe("opening_warm");
  });

  it("uses qa baseline voice while expression profile drives vrm for mode qa", () => {
    const action: DirectorAction = {
      schema_version: "1.0",
      mode: "qa",
      utterance: "材料在第 2 页。",
      emotion: "serious",
      gesture: "point_slide",
    };

    const resolved = resolveBeatPerformance(action);
    expect(resolved.profileName).toBe("serious");
    expect(resolved.vrmExpression).toBe("relaxed");
    expect(resolved.gesture).toBe("point_slide");
    expect(resolved.voice.speaker).toBe("zh-CN-XiaoxiaoNeural");
    expect(resolved.voice.speed).toBe(1.02);
    expect(resolved.voice.pitch).toBeUndefined();
    expect(resolved.timing.pause_before_ms).toBe(100);
    expect(resolved.timing.pause_after_ms).toBe(200);

    const directive = resolveVoiceDirective(action, resolved);
    expect(directive.speaker).toBe("zh-CN-XiaoxiaoNeural");
    expect(directive.rate).toBe(1.02);
  });

  it("allows action.voice override on qa mode", () => {
    const action: DirectorAction = {
      schema_version: "1.0",
      mode: "qa",
      utterance: "好的。",
      emotion: "friendly",
      voice: { speed: 1.15 },
    };

    const resolved = resolveBeatPerformance(action);
    expect(resolved.voice.speed).toBe(1.15);
    expect(resolved.voice.speaker).toBe("zh-CN-XiaoxiaoNeural");
  });

  it("keeps present mode profile voice behavior unchanged", () => {
    const action: DirectorAction = {
      schema_version: "1.0",
      mode: "present",
      utterance: "讲稿",
      emotion: "serious",
    };

    const resolved = resolveBeatPerformance(action);
    expect(resolved.voice.speaker).toBe("zh-CN-YunjianNeural");
    expect(resolved.vrmExpression).toBe("relaxed");
  });
});
