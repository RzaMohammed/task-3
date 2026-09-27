/**
 * Biometric Face Liveness & Presentation Attack Detection (PAD) Assessment
 * 
 * Evaluates multi-frame face telemetry to distinguish live human subjects
 * from presentation attack spoofing vectors (printed photos, digital screens,
 * static cutouts, and replay attacks) based on ISO/IEC 30107-3 compliance.
 */

export interface FaceFrameMetrics {
  timestampMs: number;
  eyeBlinkRatio: number; // Eye Aspect Ratio (EAR), typically ~0.30 open, <0.20 closed
  headPose: {
    pitch: number; // Up/Down rotation in degrees
    yaw: number;   // Left/Right rotation in degrees
    roll: number;  // Tilt rotation in degrees
  };
  textureVariance: number; // Laplacian frequency variance of facial region
  moiréDetected?: boolean;  // Screen pixel frequency artifact detection
  glareDetected?: boolean;  // Specular reflection from glass / digital displays
}

export interface LivenessOptions {
  minFrames?: number;
  blinkThreshold?: number; // EAR below which eye is considered closed
  minMotionDegrees?: number; // Min head pose deviation to verify natural 3D motion
  minTextureVariance?: number; // Min high-frequency texture detail
  confidenceThreshold?: number; // Minimum confidence required for live verdict
}

export type AntiSpoofVerdict =
  | 'GENUINE_LIVE'
  | 'SPOOF_PHOTO_ATTACK'
  | 'SPOOF_SCREEN_REPLAY'
  | 'INSUFFICIENT_FRAMES'
  | 'EXCESSIVE_JITTER'
  | 'STATIC_PRESENTATION';

export interface LivenessAssessment {
  isLive: boolean;
  confidenceScore: number; // 0.00 to 1.00
  blinkDetected: boolean;
  motionDetected: boolean;
  textureScore: number; // 0.00 to 1.00
  antiSpoofVerdict: AntiSpoofVerdict;
  rejectionReason?: string;
  metadata: {
    totalFrames: number;
    headMotionDeltaDegrees: number;
    minEyeAspectRatio: number;
    averageTextureVariance: number;
  };
}

const DEFAULT_OPTIONS: Required<LivenessOptions> = {
  minFrames: 5,
  blinkThreshold: 0.20,
  minMotionDegrees: 4.0,
  minTextureVariance: 65.0,
  confidenceThreshold: 0.75,
};

/**
 * Normalizes texture Laplacian variance into a 0.0 - 1.0 score.
 * Natural human skin under typical lighting typically produces 80 - 250 variance.
 * Flat printouts or compressed screens fall under 60.
 */
export function calculateTextureScore(variance: number, minVariance = 65.0): number {
  if (variance <= 0) return 0;
  if (variance < minVariance) {
    return Math.max(0, variance / minVariance * 0.5);
  }
  // Smooth asymptotic curve up to 1.0
  const normalized = 0.5 + 0.5 * Math.min(1, (variance - minVariance) / 100.0);
  return Math.round(normalized * 1000) / 1000;
}

/**
 * Checks for a natural eye blink sequence: eyes open -> closed (EAR < threshold) -> open.
 */
export function detectBlink(eyeRatios: number[], threshold = 0.20): boolean {
  if (eyeRatios.length < 3) return false;

  let seenOpenBefore = false;
  let seenClosed = false;

  for (const ratio of eyeRatios) {
    if (ratio > threshold + 0.05) {
      if (seenClosed) {
        // Closed then open: complete blink!
        return true;
      }
      seenOpenBefore = true;
    } else if (ratio <= threshold && seenOpenBefore) {
      seenClosed = true;
    }
  }

  return false;
}

/**
 * Calculates total 3D rotational head movement across consecutive frames.
 */
export function detectHeadMotion(
  poses: { pitch: number; yaw: number; roll: number }[],
  minDegrees = 4.0
): { motionDetected: boolean; totalDelta: number; maxFrameJump: number } {
  if (poses.length < 2) {
    return { motionDetected: false, totalDelta: 0, maxFrameJump: 0 };
  }

  let totalDelta = 0;
  let maxFrameJump = 0;

  for (let i = 1; i < poses.length; i++) {
    const prev = poses[i - 1];
    const curr = poses[i];

    const dPitch = Math.abs(curr.pitch - prev.pitch);
    const dYaw = Math.abs(curr.yaw - prev.yaw);
    const dRoll = Math.abs(curr.roll - prev.roll);

    // Euclidean distance in Euler angles
    const frameJump = Math.sqrt(dPitch * dPitch + dYaw * dYaw + dRoll * dRoll);
    if (frameJump > maxFrameJump) {
      maxFrameJump = frameJump;
    }
    totalDelta += frameJump;
  }

  return {
    motionDetected: totalDelta >= minDegrees,
    totalDelta: Math.round(totalDelta * 100) / 100,
    maxFrameJump: Math.round(maxFrameJump * 100) / 100,
  };
}

/**
 * Evaluates a sequence of video capture frames to determine biometric liveness.
 */
export function assessFaceLiveness(
  frames: FaceFrameMetrics[],
  options?: LivenessOptions
): LivenessAssessment {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (!frames || frames.length < opts.minFrames) {
    return {
      isLive: false,
      confidenceScore: 0.0,
      blinkDetected: false,
      motionDetected: false,
      textureScore: 0.0,
      antiSpoofVerdict: 'INSUFFICIENT_FRAMES',
      rejectionReason: `Need at least ${opts.minFrames} continuous frames, received ${frames ? frames.length : 0}`,
      metadata: {
        totalFrames: frames ? frames.length : 0,
        headMotionDeltaDegrees: 0,
        minEyeAspectRatio: 1.0,
        averageTextureVariance: 0,
      },
    };
  }

  const eyeRatios = frames.map((f) => f.eyeBlinkRatio);
  const headPoses = frames.map((f) => f.headPose);
  const textureVariances = frames.map((f) => f.textureVariance);

  const avgTexture =
    textureVariances.reduce((acc, v) => acc + v, 0) / textureVariances.length;
  const minEAR = Math.min(...eyeRatios);

  // Artifact flags
  const screenMoiréCount = frames.filter((f) => f.moiréDetected).length;
  const screenGlareCount = frames.filter((f) => f.glareDetected).length;

  const blinkDetected = detectBlink(eyeRatios, opts.blinkThreshold);
  const motion = detectHeadMotion(headPoses, opts.minMotionDegrees);
  const textureScore = calculateTextureScore(avgTexture, opts.minTextureVariance);

  // Excessive jitter check (> 45 degrees jump between single frames indicates spliced frames)
  if (motion.maxFrameJump > 45) {
    return {
      isLive: false,
      confidenceScore: 0.1,
      blinkDetected,
      motionDetected: motion.motionDetected,
      textureScore,
      antiSpoofVerdict: 'EXCESSIVE_JITTER',
      rejectionReason: `Unnatural erratic pose jump detected (${motion.maxFrameJump}° between frames)`,
      metadata: {
        totalFrames: frames.length,
        headMotionDeltaDegrees: motion.totalDelta,
        minEyeAspectRatio: minEAR,
        averageTextureVariance: avgTexture,
      },
    };
  }

  // Presentation attack detection (screen replay)
  if (screenMoiréCount >= 2 || screenGlareCount >= 3) {
    return {
      isLive: false,
      confidenceScore: 0.15,
      blinkDetected,
      motionDetected: motion.motionDetected,
      textureScore: Math.min(textureScore, 0.3),
      antiSpoofVerdict: 'SPOOF_SCREEN_REPLAY',
      rejectionReason: 'Screen pixel moiré patterns or specular display reflections detected',
      metadata: {
        totalFrames: frames.length,
        headMotionDeltaDegrees: motion.totalDelta,
        minEyeAspectRatio: minEAR,
        averageTextureVariance: avgTexture,
      },
    };
  }

  // Presentation attack detection (static photo / printed paper)
  if (!motion.motionDetected && !blinkDetected) {
    return {
      isLive: false,
      confidenceScore: 0.05,
      blinkDetected: false,
      motionDetected: false,
      textureScore,
      antiSpoofVerdict: avgTexture < opts.minTextureVariance ? 'SPOOF_PHOTO_ATTACK' : 'STATIC_PRESENTATION',
      rejectionReason: 'Zero natural head motion or eye blinks detected across capture window',
      metadata: {
        totalFrames: frames.length,
        headMotionDeltaDegrees: motion.totalDelta,
        minEyeAspectRatio: minEAR,
        averageTextureVariance: avgTexture,
      },
    };
  }

  // Low texture attack
  if (textureScore < 0.45) {
    return {
      isLive: false,
      confidenceScore: 0.25,
      blinkDetected,
      motionDetected: motion.motionDetected,
      textureScore,
      antiSpoofVerdict: 'SPOOF_PHOTO_ATTACK',
      rejectionReason: 'Facial micro-texture variance below minimum human threshold',
      metadata: {
        totalFrames: frames.length,
        headMotionDeltaDegrees: motion.totalDelta,
        minEyeAspectRatio: minEAR,
        averageTextureVariance: avgTexture,
      },
    };
  }

  // Weight composite confidence score
  // Blink: 35%, Motion: 35%, Texture: 30%
  let score = 0;
  if (blinkDetected) score += 0.35;
  if (motion.motionDetected) {
    const motionGradation = Math.min(1.0, motion.totalDelta / (opts.minMotionDegrees * 2));
    score += 0.35 * motionGradation;
  }
  score += 0.30 * textureScore;

  const confidenceScore = Math.min(1.0, Math.round(score * 1000) / 1000);
  const isLive = confidenceScore >= opts.confidenceThreshold;

  return {
    isLive,
    confidenceScore,
    blinkDetected,
    motionDetected: motion.motionDetected,
    textureScore,
    antiSpoofVerdict: isLive ? 'GENUINE_LIVE' : 'STATIC_PRESENTATION',
    rejectionReason: isLive ? undefined : 'Composite liveness confidence below threshold',
    metadata: {
      totalFrames: frames.length,
      headMotionDeltaDegrees: motion.totalDelta,
      minEyeAspectRatio: minEAR,
      averageTextureVariance: Math.round(avgTexture * 10) / 10,
    },
  };
}
