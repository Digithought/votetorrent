import { Carve } from './carve.js';

export * from './carve.js';

// --- Testbed ---
const carve = new Carve('test-secret', 5);
const plaintext = [1, 0, 1, 1];
const registers = [10, 20, 30, 40];

console.log('Plaintext:', plaintext);

const ciphertext = carve.encrypt(plaintext, registers);
console.log('Ciphertext:', ciphertext);

const decrypted = carve.decrypt(ciphertext);
console.log('Decrypted:', decrypted);
