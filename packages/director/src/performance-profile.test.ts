import { describe, expect, it } from "vitest";
import type { DirectorAction } from "./types.js";
import {
  DEFAULT_PERFORMANCE_CATALOG,
  mergePerformanceCatalogs,
  resolveBeatPerformance,
} from "./performance-profile.js";

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
});
