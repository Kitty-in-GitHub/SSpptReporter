import { useEffect, useState } from 'react';
import type { CameraVideoBackend } from '../types/settings';
import { cameraLog, cameraWarn } from '../lib/cameraLog';

/**
 * 采集后端 —— 在 Chromium 里是**两条完全不同的取帧路径**，可切换对照：
 *
 * - `videoFrameCallback`：`<video>` + `requestVideoFrameCallback`。
 * - `grabFrame`：`ImageCapture.grabFrame()` 轮询（Windows 上走静态抓帧实现）。
 *
 * ⚠️ 判定「流是否活着」不能用后端的取帧次数：`grabFrame` 在一条已经卡死的流上
 * 仍可能继续返回同一帧。流活性取自**元素级信号**：
 * - `requestVideoFrameCallback`：只在「有新帧真正呈现」时回调，最可靠
 * - `getVideoPlaybackQuality().totalVideoFrames`：Chromium 会填，**Firefox 对
 *   MediaStream 恒为 0**（实测），不能单独依赖
 * - `currentTime`：**只在本会话从未见过任何帧计数时才允许兜底**。它是播放时钟，
 *   对 MediaStream 而言一帧都不来也会每秒推进 —— 当成并集信号会把「冻结」误报成
 *   「流动」，`idleMs` 永远是 0，看门狗因此永不触发（Edge 上实测）。
 *
 * 后端计数（`backendFrames` / `backendFps`）只表示「这个后端还活着吗」，与流活性分开看。
 */
export type VideoSourceStatus =
  | 'idle'
  | 'opening'
  | 'streaming'
  | 'stalled'
  | 'error';

export interface VideoSourceState {
  status: VideoSourceStatus;
  error: string | null;
  /** 设备名 */
  label: string;
  /** 协商出的分辨率 */
  resolution: string;
  /** 实际生效的采集后端（grabFrame 不可用时会回退，这里是事实） */
  activeBackend: CameraVideoBackend | null;
  /** 元素级「呈现帧」计数（rVFC）；不支持时为 0 */
  presentedFrames: number;
  /** 元素累计解码帧数；**Firefox 对 MediaStream 恒为 0** */
  videoDecodedFrames: number;
  /**
   * 近 1 秒流自身的帧率（优先呈现帧、其次解码帧）—— UI 的「约 N fps」用它。
   * 只有在本浏览器两个帧计数都拿不到时才退化为播放时钟增量；
   * 那种情况下它只表示「元素在播放」，不代表真有帧率。
   */
  streamFps: number;
  /** 当前后端累计取到帧的次数（grabFrame 模式即「抓帧次数」） */
  backendFrames: number;
  /** 当前后端近 1 秒的取帧速率；grabFrame 上限约 5，**与流帧率无关** */
  backendFps: number;
  /** 距上一次流出新帧过去了多久 */
  idleMs: number;
  /** 当前后端是否还在取到帧（与「流活着」是两件事） */
  backendAlive: boolean;
  /** 自愈重开的次数 */
  restarts: number;
  /** 连续重开失败过多，已停止自动恢复 */
  gaveUp: boolean;
  /** 预览显示用；模块内部另有一个不可见的 video 做度量 */
  stream: MediaStream | null;
  /**
   * **帧源**：面捕引擎从这里取像素 —— 就是模块内部那个探针 `<video>`，
   * 复用它可以少挂一条 sink（Firefox 上该元素确实在正常出帧）。
   * 自愈重开会换一个元素，消费方按 `stream` / 本字段的 identity 重建即可；
   * 换的空窗期元素会退化成 `readyState=0`，取帧方跳过即可。
   */
  frameSource: HTMLVideoElement | null;
}

export interface VideoSourceOptions {
  enabled: boolean;
  deviceId: string;
  backend: CameraVideoBackend;
}

/** 采样与判定 */
const SAMPLE_MS = 1000;
/** 流多久没出新帧算卡死 */
const STALL_TIMEOUT_MS = 4000;
/** grabFrame 轮询间隔 */
const GRAB_INTERVAL_MS = 200;
/** 心跳日志间隔 */
const HEARTBEAT_MS = 10000;
/** 重开失败退避：起点、上限 */
const RETRY_BASE_MS = 500;
const RETRY_MAX_MS = 15000;
/** 连续失败多少次后放弃自动恢复 */
const MAX_CONSECUTIVE_FAILURES = 5;
/** currentTime 判定阈值（秒）：小于它视为没动 */
const TIME_EPSILON_S = 0.02;

const IDLE_STATE: VideoSourceState = {
  status: 'idle',
  error: null,
  label: '',
  resolution: '',
  activeBackend: null,
  presentedFrames: 0,
  videoDecodedFrames: 0,
  streamFps: 0,
  backendFrames: 0,
  backendFps: 0,
  idleMs: 0,
  backendAlive: false,
  restarts: 0,
  gaveUp: false,
  stream: null,
  frameSource: null,
};

export interface UseVideoSourceResult {
  state: VideoSourceState;
}

/** 把 getUserMedia 的异常翻成能直接照着做的说明 */
function explainGetUserMediaError(error: unknown): string {
  if (!(error instanceof DOMException)) {
    return error instanceof Error ? error.message : '未知错误';
  }
  switch (error.name) {
    case 'NotAllowedError':
      return '权限被拒（弹窗里选了「阻止」，或系统隐私设置/企业策略禁止）。点地址栏左侧的权限图标改回「允许」';
    case 'NotFoundError':
      return '找不到可用摄像头（设备被禁用或未连接）';
    case 'NotReadableError':
      return '设备被占用或驱动异常：关掉其它正在使用摄像头的程序再试';
    case 'OverconstrainedError':
      return '当前约束没有匹配的采集模式（deviceId 或分辨率不被设备支持）';
    case 'NotSupportedError':
      return '当前上下文不支持采集（需要 https 或 localhost）';
    case 'AbortError':
      return '采集被中断（通常是被其它操作抢占，重试即可）';
    default:
      return `${error.name}: ${error.message}`;
  }
}

/**
 * 权限与设备面的事实快照。
 * **deviceId/label 为空串是「尚未授权」的经典信号** —— 授权前后各打一次即可对照。
 */
async function describeCameraAccess(): Promise<Record<string, unknown>> {
  const info: Record<string, unknown> = {};
  try {
    if (navigator.permissions?.query) {
      // TS 的 PermissionName 未含 'camera'，Chrome 实际支持
      const status = await navigator.permissions.query({
        name: 'camera' as PermissionName,
      });
      info.permission = status.state;
    } else {
      info.permission = 'Permissions API 不可用';
    }
  } catch (error) {
    info.permission = `查询失败：${
      error instanceof Error ? error.message : String(error)
    }`;
  }
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const inputs = devices.filter((device) => device.kind === 'videoinput');
    info.videoInputs = inputs.length;
    info.labelsVisible = inputs.some((device) => Boolean(device.label));
    info.labels = inputs.map((device) => device.label || '(无名称)');
  } catch (error) {
    info.videoInputs = `枚举失败：${
      error instanceof Error ? error.message : String(error)
    }`;
  }
  return info;
}

/**
 * 摄像头视频采集（独立模块，只做采集）。
 *
 * 职责边界：拿到一条活着的 video track，并把「帧还活着吗」这件事量化出来。
 * **不做**任何识别、不做像素搬运、不碰渲染。面捕/推理将来建在它之上。
 */
export function useVideoSource(options: VideoSourceOptions): UseVideoSourceResult {
  const [state, setState] = useState<VideoSourceState>(IDLE_STATE);

  useEffect(() => {
    if (!options.enabled) {
      setState(IDLE_STATE);
      return;
    }

    let disposed = false;
    let stream: MediaStream | null = null;
    let video: HTMLVideoElement | null = null;
    let sampleTimer = 0;
    let grabTimer = 0;
    let restartTimer = 0;
    let rvfcId = 0;
    let restarting = false;

    /**
     * 代数号：`teardown()` 与每次 `startBackend()` 都会 +1。
     * 异步闭包（尤其 grabFrame 的定时链）在恢复执行时校验它，
     * 避免 restart 之后旧循环复活、出现两条抓帧链。
     */
    let generation = 0;

    /** 元素级呈现帧计数（rVFC），作为「流活性」的首选信号 */
    let presentedFrames = 0;
    /**
     * 本会话是否见过「帧计数」推进（呈现帧或解码帧曾 > 0）。
     * 见过的浏览器从此只认帧计数；一次都没见过的（Firefox 对 MediaStream 的解码帧恒为 0、
     * rVFC 也可能不回调）才允许用播放时钟兜底。
     */
    let hasFrameCounterSignal = false;
    /** grabFrame 成功次数，作为「后端活性」信号 */
    let grabFrames = 0;
    let activeBackend: CameraVideoBackend = 'videoFrameCallback';

    let lastPresented = 0;
    let lastDecoded = 0;
    let lastTime = 0;
    let lastGrab = 0;
    let lastStreamFrameAt = 0;
    let lastHeartbeatAt = 0;
    let restarts = 0;
    let consecutiveFailures = 0;
    let gaveUp = false;
    let status: VideoSourceStatus = 'opening';

    const teardown = () => {
      generation += 1;
      window.clearInterval(sampleTimer);
      window.clearTimeout(grabTimer);
      window.clearTimeout(restartTimer);
      grabTimer = 0;
      restartTimer = 0;
      if (video && rvfcId) {
        video.cancelVideoFrameCallback(rvfcId);
      }
      rvfcId = 0;
      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        stream = null;
      }
      if (video) {
        video.srcObject = null;
        video.remove();
        video = null;
      }
    };

    const publish = (patch: Partial<VideoSourceState>) => {
      setState((prev) => ({ ...prev, ...patch }));
    };

    /** 元素级信号：三个来源分别读，判定时取并集 */
    const readElementSignals = () => ({
      decoded: video?.getVideoPlaybackQuality?.().totalVideoFrames ?? 0,
      time: video?.currentTime ?? 0,
      presented: presentedFrames,
    });

    const startProbe = (next: MediaStream, myGeneration: number) => {
      const element = document.createElement('video');
      element.playsInline = true;
      element.muted = true;
      // 不可见但要在文档里：Chromium 对「不在文档里」的媒体元素出帧并不可靠。
      // 不能用 display:none —— 那会让元素完全不渲染。
      element.style.cssText =
        'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none;';
      element.srcObject = next;
      document.body.appendChild(element);
      video = element;
      void element.play().catch((error: unknown) => {
        cameraWarn('探针 video 播放被拒', error);
      });

      if (typeof element.requestVideoFrameCallback !== 'function') {
        cameraWarn(
          '本浏览器不支持 requestVideoFrameCallback：流活性改用解码帧数 / currentTime 判定' +
            '（Firefox 对 MediaStream 的解码帧数恒为 0，将主要依赖 currentTime）',
        );
        return;
      }
      const onPresented = () => {
        if (disposed || generation !== myGeneration || video !== element) {
          return;
        }
        presentedFrames += 1;
        rvfcId = element.requestVideoFrameCallback(onPresented);
      };
      rvfcId = element.requestVideoFrameCallback(onPresented);
    };

    /** 启动所选后端；grabFrame 不可用时回退为「只度量不额外取帧」 */
    const startBackend = (next: MediaStream, myGeneration: number) => {
      const track = next.getVideoTracks()[0];
      if (options.backend !== 'grabFrame') {
        activeBackend = 'videoFrameCallback';
        return;
      }
      if (!track || typeof ImageCapture !== 'function') {
        cameraWarn('ImageCapture 不可用，回退到 requestVideoFrameCallback');
        activeBackend = 'videoFrameCallback';
        return;
      }

      let capture: ImageCapture & { grabFrame(): Promise<ImageBitmap> };
      try {
        // lib.dom 里 ImageCapture 只声明了 takePhoto，grabFrame 是 Chrome 的实现
        capture = new ImageCapture(track) as ImageCapture & {
          grabFrame(): Promise<ImageBitmap>;
        };
      } catch (error) {
        // 构造失败（track 已 ended 等）必须回退，否则会握着已打开的流停在 error
        cameraWarn('ImageCapture 构造失败，回退到 requestVideoFrameCallback', error);
        activeBackend = 'videoFrameCallback';
        return;
      }

      activeBackend = 'grabFrame';
      const grab = async () => {
        if (disposed || generation !== myGeneration) {
          return;
        }
        try {
          const bitmap = await capture.grabFrame();
          bitmap.close();
          grabFrames += 1;
        } catch (error) {
          cameraWarn('grabFrame 失败', error);
        }
        // 代数号校验：restart 之后旧链必须就此结束，不能复活
        if (!disposed && generation === myGeneration) {
          grabTimer = window.setTimeout(grab, GRAB_INTERVAL_MS);
        }
      };
      cameraLog('采集后端已启动：ImageCapture.grabFrame', {
        intervalMs: GRAB_INTERVAL_MS,
      });
      grabTimer = window.setTimeout(grab, 0);
    };

    /** @returns 是否成功打开 */
    const open = async (): Promise<boolean> => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('当前浏览器不支持摄像头访问。');
        }
        // 严格模式下 React 会在**同一个同步批次**里跑「挂载 → 卸载 → 再挂载」，
        // 两次 open() 都会在本行微任务处挂起；第一个恢复时 disposed 必为 true，
        // 于是只有第二次真正发起请求（getUserMedia 本身不可取消，所以必须提前拦）。
        await Promise.resolve();
        if (disposed) {
          cameraLog('第一次挂载已被严格模式回收，放弃本次请求');
          return false;
        }

        publish({ status: 'opening', error: null });
        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: options.deviceId ? { exact: options.deviceId } : undefined,
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        };
        // 权限/设备面：授权前 enumerateDevices 的 label 与 deviceId 都是空串
        cameraLog('授权前状态', await describeCameraAccess());
        cameraLog('请求摄像头', { constraints, backend: options.backend });
        const next = await navigator.mediaDevices.getUserMedia(constraints);
        if (disposed) {
          for (const t of next.getTracks()) {
            t.stop();
          }
          return false;
        }
        stream = next;
        cameraLog('授权后状态', await describeCameraAccess());

        presentedFrames = 0;
        grabFrames = 0;
        hasFrameCounterSignal = false;
        lastPresented = 0;
        lastDecoded = 0;
        lastTime = 0;
        lastGrab = 0;
        lastStreamFrameAt = performance.now();

        const myGeneration = ++generation;
        startProbe(next, myGeneration);
        startBackend(next, myGeneration);

        const track = next.getVideoTracks()[0];
        const settings = track?.getSettings();
        cameraLog('采集已启动', {
          label: track?.label,
          activeBackend,
          settings,
        });

        consecutiveFailures = 0;
        status = 'streaming';
        setState({
          status: 'streaming',
          error: null,
          label: track?.label ?? '',
          resolution:
            settings?.width && settings?.height
              ? `${settings.width}×${settings.height}`
              : '',
          activeBackend,
          presentedFrames: 0,
          videoDecodedFrames: 0,
          streamFps: 0,
          backendFrames: 0,
          backendFps: 0,
          idleMs: 0,
          backendAlive: false,
          restarts,
          gaveUp: false,
          stream: next,
          // 探针元素就是面捕引擎的帧源（少挂一条 sink）
          frameSource: video,
        });
        return true;
      } catch (caught) {
        // 权限/设备类失败要给出可执行的说明，而不是把 DOMException 原文丢给用户
        const hint = explainGetUserMediaError(caught);
        cameraWarn('打开摄像头失败', {
          name: caught instanceof DOMException ? caught.name : undefined,
          raw: caught,
          hint,
          access: await describeCameraAccess(),
        });
        if (!disposed) {
          setState((prev) => ({ ...prev, status: 'error', error: hint }));
        }
        return false;
      }
    };

    /** 流/后端都断了才重开：后端正跑着时重开只会把可用的路径打断 */
    const scheduleRestart = () => {
      if (disposed || restarting || gaveUp) {
        return;
      }
      restarting = true;
      restarts += 1;
      const delay = Math.min(
        RETRY_BASE_MS * 2 ** consecutiveFailures,
        RETRY_MAX_MS,
      );
      cameraWarn('卡帧自愈：重开采集', { restarts, consecutiveFailures, delay });
      teardown();
      restartTimer = window.setTimeout(() => {
        restartTimer = 0;
        if (disposed) {
          restarting = false;
          return;
        }
        void open().then((ok) => {
          // restarting 必须保持到 open 结束：期间 video 为 null，
          // 若提前置假，采样会再判一次 stalled 并叠加一次重开
          restarting = false;
          if (disposed || ok) {
            return;
          }
          consecutiveFailures += 1;
          if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            gaveUp = true;
            status = 'error';
            cameraWarn('连续重开失败，停止自动恢复', { consecutiveFailures });
            publish({
              status: 'error',
              error: `摄像头连续 ${consecutiveFailures} 次打开失败，已停止自动恢复`,
              gaveUp: true,
            });
            return;
          }
          scheduleRestart();
        });
      }, delay);
    };

    const sample = () => {
      // 重开窗口内不采样：此时 video/stream 已被 teardown 置空，
      // 继续判定会短暂误报 stalled、还可能叠加一次 scheduleRestart。
      // 开流期同理 —— 元素还没建，测出来必然是「静止」，只会刷假日志
      if (disposed || restarting || !video) {
        return;
      }

      const signals = readElementSignals();
      if (signals.presented > 0 || signals.decoded > 0) {
        hasFrameCounterSignal = true;
      }
      const presentedAdvanced = signals.presented > lastPresented;
      const decodedAdvanced = signals.decoded > lastDecoded;
      const clockAdvanced = signals.time > lastTime + TIME_EPSILON_S;
      // 帧计数可用后只认帧计数；播放时钟只在「本浏览器两个计数都拿不到」时兜底
      const streamAdvanced = hasFrameCounterSignal
        ? presentedAdvanced || decodedAdvanced
        : presentedAdvanced || decodedAdvanced || clockAdvanced;
      // 帧率优先用「呈现帧」增量（最贴近真实帧率），否则退回解码帧增量；
      // 时钟增量只在上面那条兜底成立时才算
      const presentedDelta = signals.presented - lastPresented;
      const decodedDelta = signals.decoded - lastDecoded;
      const timeDelta = signals.time - lastTime;
      const streamFps =
        presentedDelta > 0
          ? Math.round((presentedDelta * 1000) / SAMPLE_MS)
          : decodedDelta > 0
            ? Math.round((decodedDelta * 1000) / SAMPLE_MS)
            : !hasFrameCounterSignal && timeDelta > TIME_EPSILON_S
              ? Math.round((timeDelta * 1000) / SAMPLE_MS)
              : 0;
      if (streamAdvanced) {
        lastStreamFrameAt = performance.now();
      }

      const backendFrames =
        activeBackend === 'grabFrame' ? grabFrames : signals.presented;
      const backendAdvanced =
        activeBackend === 'grabFrame'
          ? grabFrames > lastGrab
          : streamAdvanced;
      // 必须用「更新 last* 之前」的增量：原先拿 signals.presented - lastPresented
      // 时 lastPresented 已被赋成同一个值，videoFrameCallback 后端下恒算出 0
      const backendFps = Math.round(
        ((activeBackend === 'grabFrame'
          ? grabFrames - lastGrab
          : presentedDelta) *
          1000) /
          SAMPLE_MS,
      );
      lastGrab = grabFrames;

      lastPresented = signals.presented;
      lastDecoded = signals.decoded;
      lastTime = signals.time;

      const idleMs = lastStreamFrameAt
        ? Math.round(performance.now() - lastStreamFrameAt)
        : 0;
      const nextStatus: VideoSourceStatus = streamAdvanced
        ? 'streaming'
        : 'stalled';

      publish({
        status: nextStatus,
        presentedFrames: signals.presented,
        videoDecodedFrames: signals.decoded,
        streamFps,
        backendFrames,
        backendFps,
        idleMs,
        backendAlive: backendAdvanced,
        restarts,
      });

      if (status !== nextStatus) {
        if (nextStatus === 'stalled') {
          cameraWarn('流已停止出新帧', {
            idleMs,
            backend: activeBackend,
            backendAlive: backendAdvanced,
            signals,
          });
        } else {
          cameraLog('流恢复出帧', { backend: activeBackend });
        }
        status = nextStatus;
      }

      const now = performance.now();
      if (now - lastHeartbeatAt >= HEARTBEAT_MS) {
        lastHeartbeatAt = now;
        cameraLog('心跳', {
          backend: activeBackend,
          streamFps,
          idleMs,
          streamAlive: streamAdvanced,
          backendAlive: backendAdvanced,
          signals,
          grabFrames,
        });
      }

      // 只有「流和后端都不出帧」才重开；后端正跑着时重开会把可用路径打断
      if (!streamAdvanced && !backendAdvanced && idleMs >= STALL_TIMEOUT_MS) {
        scheduleRestart();
      }
    };

    void open();
    sampleTimer = window.setInterval(sample, SAMPLE_MS);

    return () => {
      disposed = true;
      cameraLog('关闭采集', { restarts, gaveUp });
      teardown();
    };
  }, [options.backend, options.deviceId, options.enabled]);

  return { state };
}
