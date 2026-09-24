import { cosineDistance } from './vectorMath';

/**
 * 8-Bit Scalar Vector Quantizer & Dequantizer
 * Compresses floating-point biometric embedding vectors into compact 8-bit signed integer representations,
 * dramatically reducing storage footprint on-chain and over network while retaining high cosine fidelity.
 */

export interface QuantizedVector {
  values: number[]; // Int8 numbers in range [-128, 127]
  minVal: number;
  maxVal: number;
  scale: number;
  dimensions: number;
}

export interface QuantizationMetrics {
  maxError: number;
  meanSquaredError: number;
}

/**
 * Quantizes a float embedding vector into an 8-bit representation [-128, 127].
 *
 * @param vector Array of float values
 * @returns QuantizedVector with int8 values and quantization parameters
 */
export function quantizeVector(vector: number[]): QuantizedVector {
  if (!Array.isArray(vector) || vector.length === 0) {
    throw new Error('Vector must be a non-empty array of numbers');
  }

  let minVal = Infinity;
  let maxVal = -Infinity;

  for (let i = 0; i < vector.length; i++) {
    const val = vector[i];
    if (typeof val !== 'number' || isNaN(val)) {
      throw new Error(`Invalid numeric element at index ${i}`);
    }
    if (val < minVal) minVal = val;
    if (val > maxVal) maxVal = val;
  }

  // Handle uniform vectors where all elements are identical
  if (minVal === maxVal) {
    return {
      values: new Array(vector.length).fill(0),
      minVal,
      maxVal,
      scale: 1,
      dimensions: vector.length,
    };
  }

  const range = maxVal - minVal;
  const scale = range / 255;
  const values: number[] = new Array(vector.length);

  for (let i = 0; i < vector.length; i++) {
    const normalized = (vector[i] - minVal) / scale;
    const int8Val = Math.round(normalized) - 128;
    // Clamp safely to [-128, 127]
    values[i] = Math.max(-128, Math.min(127, int8Val));
  }

  return {
    values,
    minVal,
    maxVal,
    scale,
    dimensions: vector.length,
  };
}

/**
 * Dequantizes an 8-bit quantized vector back into reconstructed floating point values.
 *
 * @param qv QuantizedVector
 * @returns Reconstructed array of float numbers
 */
export function dequantizeVector(qv: QuantizedVector): number[] {
  if (!qv || !Array.isArray(qv.values)) {
    throw new Error('Invalid quantized vector input');
  }

  if (qv.minVal === qv.maxVal) {
    return new Array(qv.dimensions).fill(qv.minVal);
  }

  const reconstructed: number[] = new Array(qv.values.length);
  const { minVal, scale, values } = qv;

  for (let i = 0; i < values.length; i++) {
    reconstructed[i] = (values[i] + 128) * scale + minVal;
  }

  return reconstructed;
}

/**
 * Calculates cosine distance between two quantized vectors by reconstructing them.
 *
 * @param a First quantized vector
 * @param b Second quantized vector
 * @returns Cosine distance in range [0.0, 2.0]
 */
export function quantizedCosineDistance(a: QuantizedVector, b: QuantizedVector): number {
  if (a.dimensions !== b.dimensions) {
    throw new Error(`Quantized vector dimension mismatch: ${a.dimensions} vs ${b.dimensions}`);
  }
  const vecA = dequantizeVector(a);
  const vecB = dequantizeVector(b);
  return cosineDistance(vecA, vecB);
}

/**
 * Evaluates reconstruction fidelity between original vector and dequantized vector.
 *
 * @param original Original float array
 * @param reconstructed Reconstructed float array
 */
export function calculateQuantizationError(
  original: number[],
  reconstructed: number[]
): QuantizationMetrics {
  if (original.length !== reconstructed.length) {
    throw new Error('Dimension mismatch between original and reconstructed vectors');
  }
  if (original.length === 0) {
    return { maxError: 0, meanSquaredError: 0 };
  }

  let maxError = 0;
  let sumSquaredError = 0;

  for (let i = 0; i < original.length; i++) {
    const error = Math.abs(original[i] - reconstructed[i]);
    if (error > maxError) {
      maxError = error;
    }
    sumSquaredError += error * error;
  }

  return {
    maxError,
    meanSquaredError: sumSquaredError / original.length,
  };
}
