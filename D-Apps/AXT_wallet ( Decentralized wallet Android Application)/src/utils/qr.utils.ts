/**
 * Pure TypeScript QR Code Generator (Zero Dependencies)
 * Implements ISO/IEC 18004 QR Code Model 2 with Reed-Solomon Error Correction.
 */

// Galois Field GF(256) tables for Reed-Solomon error correction
const GF256_EXP = new Uint8Array(512);
const GF256_LOG = new Uint8Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x;
    GF256_EXP[i + 255] = x;
    GF256_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d; // Primitive polynomial: x^8 + x^4 + x^3 + x^2 + 1
    }
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF256_EXP[GF256_LOG[x] + GF256_LOG[y]];
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const nextPoly = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      nextPoly[j] ^= gfMul(poly[j], GF256_EXP[i]);
      nextPoly[j + 1] ^= poly[j];
    }
    poly = nextPoly;
  }
  return poly;
}

function rsCalculateRemainder(data: Uint8Array, numEcc: number): Uint8Array {
  const gen = rsGeneratorPoly(numEcc);
  const remainder = new Uint8Array(numEcc);

  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    for (let j = 0; j < numEcc - 1; j++) {
      remainder[j] = remainder[j + 1] ^ gfMul(gen[j], factor);
    }
    remainder[numEcc - 1] = gfMul(gen[numEcc - 1], factor);
  }
  return remainder;
}

// Version table definitions for ECC Level M (suitable for addresses of length ~42 chars)
// Version 3: 29x29, 44 data capacity bytes, 26 ECC bytes
// Version 4: 33x33, 64 data capacity bytes, 36 ECC bytes
interface QRVersionSpec {
  version: number;
  size: number;
  dataBytes: number;
  eccBytes: number;
  alignmentPatterns: number[];
}

const QR_VERSIONS: QRVersionSpec[] = [
  { version: 1, size: 21, dataBytes: 16, eccBytes: 10, alignmentPatterns: [] },
  { version: 2, size: 25, dataBytes: 28, eccBytes: 16, alignmentPatterns: [6, 18] },
  { version: 3, size: 29, dataBytes: 44, eccBytes: 26, alignmentPatterns: [6, 22] },
  { version: 4, size: 33, dataBytes: 64, eccBytes: 36, alignmentPatterns: [6, 26] },
  { version: 5, size: 37, dataBytes: 86, eccBytes: 48, alignmentPatterns: [6, 30] },
];

/**
 * Encodes text into a standard QR code 2D boolean grid (true = dark, false = light).
 */
export function generateQRCodeMatrix(text: string): boolean[][] {
  const textBytes = new TextEncoder().encode(text);
  const textLen = textBytes.length;

  // Find minimum version that fits data (Byte mode: 4 bits mode + 8 bits length + payload)
  let chosenVersion: QRVersionSpec | null = null;
  for (const v of QR_VERSIONS) {
    if (v.dataBytes >= textLen + 3) {
      chosenVersion = v;
      break;
    }
  }

  if (!chosenVersion) {
    chosenVersion = QR_VERSIONS[QR_VERSIONS.length - 1];
  }

  const { size, dataBytes, eccBytes, alignmentPatterns } = chosenVersion;

  // 1. Bit Buffer: 0100 (Byte mode) + 8-bit length + data + terminator + pad bytes
  const bitArray: number[] = [];
  const pushBits = (value: number, count: number) => {
    for (let i = count - 1; i >= 0; i--) {
      bitArray.push((value >> i) & 1);
    }
  };

  pushBits(0b0100, 4); // Byte mode indicator
  pushBits(textLen, 8); // Character count indicator
  for (let i = 0; i < textLen; i++) {
    pushBits(textBytes[i], 8);
  }

  // Terminator
  const totalDataBits = dataBytes * 8;
  const termBits = Math.min(4, totalDataBits - bitArray.length);
  pushBits(0, termBits);

  // Byte alignment
  while (bitArray.length % 8 !== 0) {
    bitArray.push(0);
  }

  // Pad bytes (0xEC, 0x11)
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bitArray.length < totalDataBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert to data buffer
  const dataBuf = new Uint8Array(dataBytes);
  for (let i = 0; i < dataBytes; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bitArray[i * 8 + b];
    }
    dataBuf[i] = byteVal;
  }

  // 2. Reed-Solomon Error Correction
  const eccBuf = rsCalculateRemainder(dataBuf, eccBytes);

  // Combine data + ECC into final codewords
  const allCodewords = new Uint8Array(dataBytes + eccBytes);
  allCodewords.set(dataBuf, 0);
  allCodewords.set(eccBuf, dataBytes);

  // 3. Matrix Construction
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () =>
    Array(size).fill(null)
  );

  // Helper to place 7x7 Finder Pattern with 1px separator
  const placeFinder = (r0: number, c0: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = r0 + r;
        const col = c0 + c;
        if (row >= 0 && row < size && col >= 0 && col < size) {
          if (
            r === -1 ||
            r === 7 ||
            c === -1 ||
            c === 7 ||
            (r === 1 && c >= 1 && c <= 5) ||
            (r === 5 && c >= 1 && c <= 5) ||
            (c === 1 && r >= 1 && r <= 5) ||
            (c === 5 && r >= 1 && r <= 5)
          ) {
            matrix[row][col] = false;
          } else {
            matrix[row][col] = true;
          }
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (matrix[6][i] === null) matrix[6][i] = i % 2 === 0;
    if (matrix[i][6] === null) matrix[i][6] = i % 2 === 0;
  }

  // Dark module
  matrix[4 * chosenVersion.version + 9][8] = true;

  // Alignment patterns (if applicable)
  if (alignmentPatterns.length > 0) {
    for (const r of alignmentPatterns) {
      for (const c of alignmentPatterns) {
        if (
          (r === 6 && c === 6) ||
          (r === 6 && c === size - 7) ||
          (r === size - 7 && c === 6)
        ) {
          continue;
        }
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2;
            const isCenter = dr === 0 && dc === 0;
            matrix[r + dr][c + dc] = isBorder || isCenter;
          }
        }
      }
    }
  }

  // Reserve format info area
  for (let i = 0; i < 9; i++) {
    if (matrix[8][i] === null) matrix[8][i] = false;
    if (matrix[i][8] === null) matrix[i][8] = false;
    if (matrix[8][size - 1 - i] === null) matrix[8][size - 1 - i] = false;
    if (matrix[size - 1 - i][8] === null) matrix[size - 1 - i][8] = false;
  }

  // 4. Place Data Codewords (Zig-Zag upward/downward)
  let codewordBitIdx = 0;
  const totalBits = allCodewords.length * 8;
  const getCodewordBit = () => {
    if (codewordBitIdx >= totalBits) return false;
    const byteIdx = Math.floor(codewordBitIdx / 8);
    const bitPos = 7 - (codewordBitIdx % 8);
    codewordBitIdx++;
    return ((allCodewords[byteIdx] >> bitPos) & 1) === 1;
  };

  let upward = true;
  for (let rightCol = size - 1; rightCol > 0; rightCol -= 2) {
    if (rightCol === 6) rightCol--; // Skip vertical timing pattern column

    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const row of rows) {
      for (const col of [rightCol, rightCol - 1]) {
        if (matrix[row][col] === null) {
          const bitVal = getCodewordBit();
          // Apply Standard Mask Pattern 0: (row + col) % 2 === 0
          const mask = (row + col) % 2 === 0;
          matrix[row][col] = bitVal ? !mask : mask;
        }
      }
    }
    upward = !upward;
  }

  // 5. Place Format Information (ECC Level M = 00, Mask 0 = 000 -> 0b00000 with BCH(15,5) XOR 0x5412 = 0x5412)
  // Format bit string for Level M + Mask 0: 101010000010010
  const FORMAT_BITS = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];

  // Top-left format bits
  for (let i = 0; i <= 5; i++) matrix[8][i] = FORMAT_BITS[i] === 1;
  matrix[8][7] = FORMAT_BITS[6] === 1;
  matrix[8][8] = FORMAT_BITS[7] === 1;
  matrix[7][8] = FORMAT_BITS[8] === 1;
  for (let i = 9; i < 15; i++) matrix[14 - i][8] = FORMAT_BITS[i] === 1;

  // Split format bits around bottom-left and top-right
  for (let i = 0; i < 7; i++) matrix[size - 1 - i][8] = FORMAT_BITS[i] === 1;
  for (let i = 7; i < 15; i++) matrix[8][size - 15 + i] = FORMAT_BITS[i] === 1;

  return matrix.map((row) => row.map((cell) => cell === true));
}
