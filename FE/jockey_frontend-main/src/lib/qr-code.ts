/** Minimal QR Code Model 2 encoder for short cash pickup references (version 1-L). */
export function makeQrMatrix(value: string): boolean[][] {
  const bytes = Array.from(value, (character) => character.charCodeAt(0));
  if (bytes.length > 17) throw new Error('Cash pickup reference is too long for this QR code.');

  const data: number[] = [0x40, bytes.length];
  let bitBuffer = 0;
  let bitLength = 0;
  for (const byte of bytes) {
    bitBuffer = (bitBuffer << 8) | byte;
    bitLength += 8;
    while (bitLength >= 8) {
      bitLength -= 8;
      data.push((bitBuffer >>> bitLength) & 0xff);
    }
  }
  data.push(0);
  while (data.length < 19) data.push(data.length % 2 ? 0x11 : 0xec);
  data.length = 19;

  const multiply = (x: number, y: number) => {
    let product = 0;
    for (let i = 7; i >= 0; i--) {
      product = (product << 1) ^ ((product >>> 7) * 0x11d);
      product ^= ((y >>> i) & 1) * x;
    }
    return product;
  };
  let divisor = [1];
  let root = 1;
  for (let i = 0; i < 7; i++) {
    const next = Array(divisor.length + 1).fill(0) as number[];
    divisor.forEach((coefficient, index) => {
      next[index] ^= coefficient;
      next[index + 1] ^= multiply(coefficient, root);
    });
    divisor = next;
    root = multiply(root, 2);
  }
  const remainder = Array(7).fill(0) as number[];
  for (const byte of data) {
    const factor = byte ^ remainder.shift()!;
    remainder.push(0);
    divisor.slice(1).forEach((coefficient, index) => { remainder[index] ^= multiply(coefficient, factor); });
  }
  const codewords = [...data, ...remainder];
  const size = 21;
  const modules = Array.from({ length: size }, () => Array(size).fill(false) as boolean[]);
  const reserved = Array.from({ length: size }, () => Array(size).fill(false) as boolean[]);
  const set = (x: number, y: number, dark: boolean) => { if (x >= 0 && y >= 0 && x < size && y < size) { modules[y][x] = dark; reserved[y][x] = true; } };

  for (const [left, top] of [[0, 0], [14, 0], [0, 14]]) {
    for (let dy = -1; dy <= 7; dy++) for (let dx = -1; dx <= 7; dx++) {
      const distance = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
      set(left + dx, top + dy, distance !== 2 && distance !== 4);
    }
  }
  for (let i = 8; i < 13; i++) { set(i, 6, i % 2 === 0); set(6, i, i % 2 === 0); }

  const formatData = 8; // Error correction level L, mask pattern 0.
  let formatRemainder = formatData << 10;
  for (let i = 14; i >= 10; i--) if ((formatRemainder >>> i) & 1) formatRemainder ^= 0x537 << (i - 10);
  const format = ((formatData << 10) | formatRemainder) ^ 0x5412;
  for (let i = 0; i <= 5; i++) set(8, i, ((format >>> i) & 1) !== 0);
  set(8, 7, ((format >>> 6) & 1) !== 0); set(8, 8, ((format >>> 7) & 1) !== 0); set(7, 8, ((format >>> 8) & 1) !== 0);
  for (let i = 9; i < 15; i++) set(14 - i, 8, ((format >>> i) & 1) !== 0);
  for (let i = 0; i < 8; i++) set(size - 1 - i, 8, ((format >>> i) & 1) !== 0);
  for (let i = 8; i < 15; i++) set(8, size - 15 + i, ((format >>> i) & 1) !== 0);
  set(8, size - 8, true);

  let bitIndex = 0;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let offset = 0; offset < size; offset++) {
      const y = upward ? size - 1 - offset : offset;
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        if (reserved[y][x]) continue;
        const bit = bitIndex < codewords.length * 8 ? ((codewords[bitIndex >>> 3] >>> (7 - (bitIndex & 7))) & 1) !== 0 : false;
        modules[y][x] = bit !== ((x + y) % 2 === 0);
        bitIndex++;
      }
    }
    upward = !upward;
  }
  return modules;
}
