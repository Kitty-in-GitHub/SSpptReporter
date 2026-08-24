import {
  AnimationAction,
  AnimationClip,
  AnimationMixer,
  LoopOnce,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { VRM } from '@pixiv/three-vrm';
import {
  VRMAnimationLoaderPlugin,
  createVRMAnimationClip,
} from '@pixiv/three-vrm-animation';
import type { VRMAnimation } from '@pixiv/three-vrm-animation';

const loader = new GLTFLoader();
loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

export async function playVrmaGestureOneShot(
  mixer: AnimationMixer,
  idleAction: AnimationAction | null,
  vrm: VRM,
  url: string,
): Promise<boolean> {
  try {
    const animationGltf = await loader.loadAsync(url);
    const vrmAnimations = animationGltf.userData.vrmAnimations as
      | VRMAnimation[]
      | undefined;
    const gestureAnimation = vrmAnimations?.[0];
    if (!gestureAnimation) {
      return false;
    }

    const clip = createVRMAnimationClip(
      gestureAnimation,
      vrm as unknown as Parameters<typeof createVRMAnimationClip>[1],
    );
    const hipsNodeName = vrm.humanoid.getNormalizedBoneNode('hips')?.name;
    const stabilizedTracks = hipsNodeName
      ? clip.tracks.filter((track) => track.name !== `${hipsNodeName}.position`)
      : clip.tracks;
    const oneShotClip = new AnimationClip(
      clip.name,
      clip.duration,
      stabilizedTracks,
    );

    const gestureAction = mixer.clipAction(oneShotClip);
    gestureAction.reset();
    gestureAction.setLoop(LoopOnce, 1);
    gestureAction.clampWhenFinished = true;

    if (idleAction) {
      idleAction.fadeOut(0.25);
    }

    gestureAction.fadeIn(0.2);
    gestureAction.play();

    await new Promise<void>((resolve) => {
      const onFinished = (event: { action: AnimationAction }) => {
        if (event.action !== gestureAction) {
          return;
        }
        mixer.removeEventListener('finished', onFinished);
        gestureAction.fadeOut(0.25);
        if (idleAction) {
          idleAction.reset().fadeIn(0.3).play();
        }
        resolve();
      };
      mixer.addEventListener('finished', onFinished);
    });

    return true;
  } catch {
    return false;
  }
}
