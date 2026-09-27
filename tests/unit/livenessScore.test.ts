import {
  assessFaceLiveness,
  calculateTextureScore,
  detectBlink,
  detectHeadMotion,
  FaceFrameMetrics,
} from '../../backend/src/utils/livenessScore';

describe('Biometric Face Liveness & Anti-Spoofing Unit Tests', () => {
  const genuineLiveFrames: FaceFrameMetrics[] = [
    {
      timestampMs: 1000,
      eyeBlinkRatio: 0.32,
      headPose: { pitch: 0.5, yaw: 1.0, roll: 0.2 },
      textureVariance: 110.5,
    },
    {
      timestampMs: 1100,
      eyeBlinkRatio: 0.31,
      headPose: { pitch: 1.2, yaw: 2.1, roll: 0.4 },
      textureVariance: 108.0,
    },
    {
      timestampMs: 1200,
      eyeBlinkRatio: 0.14, // Eye closed
      headPose: { pitch: 2.0, yaw: 3.5, roll: 0.5 },
      textureVariance: 115.2,
    },
    {
      timestampMs: 1300,
      eyeBlinkRatio: 0.30, // Eye opened again
      headPose: { pitch: 2.8, yaw: 4.8, roll: 0.7 },
      textureVariance: 112.1,
    },
    {
      timestampMs: 1400,
      eyeBlinkRatio: 0.33,
      headPose: { pitch: 3.1, yaw: 5.2, roll: 0.9 },
      textureVariance: 109.4,
    },
  ];

  describe('calculateTextureScore', () => {
    it('returns 0 for non-positive variance', () => {
      expect(calculateTextureScore(0)).toBe(0);
      expect(calculateTextureScore(-10)).toBe(0);
    });

    it('returns low score for below-minimum variance', () => {
      const score = calculateTextureScore(30, 65);
      expect(score).toBeLessThan(0.5);
    });

    it('returns high score for rich texture variance', () => {
      const score = calculateTextureScore(150, 65);
      expect(score).toBeGreaterThanOrEqual(0.85);
      expect(score).toBeLessThanOrEqual(1.0);
    });
  });

  describe('detectBlink', () => {
    it('detects a completed blink cycle open -> closed -> open', () => {
      const eyeRatios = [0.32, 0.30, 0.15, 0.29, 0.31];
      expect(detectBlink(eyeRatios, 0.20)).toBe(true);
    });

    it('returns false when eyes remain continuously open', () => {
      const eyeRatios = [0.32, 0.31, 0.33, 0.30, 0.32];
      expect(detectBlink(eyeRatios, 0.20)).toBe(false);
    });

    it('returns false when insufficient frames are provided', () => {
      expect(detectBlink([0.15, 0.32], 0.20)).toBe(false);
    });
  });

  describe('detectHeadMotion', () => {
    it('calculates total 3D rotational motion across frames', () => {
      const poses = [
        { pitch: 0, yaw: 0, roll: 0 },
        { pitch: 2, yaw: 2, roll: 1 },
        { pitch: 4, yaw: 4, roll: 2 },
      ];
      const motion = detectHeadMotion(poses, 3.0);
      expect(motion.motionDetected).toBe(true);
      expect(motion.totalDelta).toBeGreaterThan(5.0);
    });

    it('detects lack of motion in static presentation', () => {
      const poses = [
        { pitch: 0.01, yaw: 0.01, roll: 0.0 },
        { pitch: 0.01, yaw: 0.01, roll: 0.0 },
        { pitch: 0.01, yaw: 0.02, roll: 0.0 },
      ];
      const motion = detectHeadMotion(poses, 4.0);
      expect(motion.motionDetected).toBe(false);
    });
  });

  describe('assessFaceLiveness', () => {
    it('validates a genuine live face with blink and natural head motion', () => {
      const result = assessFaceLiveness(genuineLiveFrames);
      expect(result.isLive).toBe(true);
      expect(result.antiSpoofVerdict).toBe('GENUINE_LIVE');
      expect(result.blinkDetected).toBe(true);
      expect(result.motionDetected).toBe(true);
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0.75);
    });

    it('rejects capture with insufficient frames', () => {
      const result = assessFaceLiveness(genuineLiveFrames.slice(0, 2), { minFrames: 5 });
      expect(result.isLive).toBe(false);
      expect(result.antiSpoofVerdict).toBe('INSUFFICIENT_FRAMES');
    });

    it('detects static photo presentation attack without motion or blinks', () => {
      const staticFrames: FaceFrameMetrics[] = genuineLiveFrames.map((f, i) => ({
        ...f,
        eyeBlinkRatio: 0.31,
        headPose: { pitch: 0, yaw: 0, roll: 0 },
        textureVariance: 35.0, // Low texture printed paper
      }));

      const result = assessFaceLiveness(staticFrames);
      expect(result.isLive).toBe(false);
      expect(result.antiSpoofVerdict).toBe('SPOOF_PHOTO_ATTACK');
    });

    it('detects digital screen replay presentation attack with moiré / glare', () => {
      const screenFrames: FaceFrameMetrics[] = genuineLiveFrames.map((f) => ({
        ...f,
        moiréDetected: true,
        glareDetected: true,
      }));

      const result = assessFaceLiveness(screenFrames);
      expect(result.isLive).toBe(false);
      expect(result.antiSpoofVerdict).toBe('SPOOF_SCREEN_REPLAY');
    });

    it('detects spliced frames with excessive pose jump', () => {
      const erraticFrames: FaceFrameMetrics[] = [
        ...genuineLiveFrames.slice(0, 2),
        {
          timestampMs: 1250,
          eyeBlinkRatio: 0.3,
          headPose: { pitch: 65.0, yaw: 70.0, roll: 45.0 }, // Huge jump
          textureVariance: 100.0,
        },
        ...genuineLiveFrames.slice(3),
      ];

      const result = assessFaceLiveness(erraticFrames);
      expect(result.isLive).toBe(false);
      expect(result.antiSpoofVerdict).toBe('EXCESSIVE_JITTER');
    });
  });
});
