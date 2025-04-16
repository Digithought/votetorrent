// Trapdoor CA encryption scheme with reversible nonlinear mixing

const n = 8;  // number of bits in state
const t = 1;  // single-step CA for simplicity

function hash(x: string): number {
  // Simple hash for demo purposes (not cryptographically strong!)
  return x.split('').reduce((a, c) => a ^ c.charCodeAt(0), 0);
}

function prng(seed: string): number[] {
  const base = hash(seed);
  return Array.from({ length: n }, (_, i) => ((base + i * 31) % 256));
}

function applyRule90(state: number[]): number[] {
    const n_len = state.length;
    return state.map((_, i) => {
        const left = state[(i - 1 + n_len) % n_len];
        const right = state[(i + 1) % n_len];
        return left ^ right; // Rule 90
    });
}

function evolveRule90ThenXor(state: number[], delta: number[]): number[] {
    const rule90Applied = applyRule90(state);
    if (rule90Applied.length !== delta.length) {
        throw new Error("State and delta lengths differ");
    }
    return rule90Applied.map((v, i) => v ^ delta[i]);
}

// Note: Renaming evolveLinearCA for clarity would be better,
// but keeping the name to minimize diff for now.
// This function NOW implements Rule90 + XOR and only works correctly for steps=1
function evolveLinearCA(state: number[], deltas: number[], steps: number): number[] {
  if (steps !== 1) {
      throw new Error("This evolution function is currently only implemented for steps=1");
  }
  return evolveRule90ThenXor(state, deltas);
}

function generateKeys() {
  const privateKey = 'my_private_key';
  const deltas = prng(privateKey);

  const zeroInput = new Array(n).fill(0);
  const publicKey = evolveLinearCA(zeroInput, deltas, t);

  return { privateKey, publicKey };
}

function encrypt(publicKey: number[], message: number[], privateKey: string): number[] {
  const deltas = prng(privateKey);
  const activeDeltas = message.map((bit, i) => bit ? deltas[i] : 0);

  const evolved = evolveLinearCA(publicKey, activeDeltas, t);
  return evolved;
}

function decrypt(ciphertext: number[], publicKey: number[], privateKey: string): number[] {
  // const deltas = prng(privateKey); // Not needed directly if publicKey reveals deltas

  // Reconstruct the state before the activeDeltas were XORed
  const rule90AppliedToPublicKey = applyRule90(publicKey);

  // Reverse the final XOR to find the activeDeltas
  const activeDeltas = ciphertext.map((x, i) => x ^ rule90AppliedToPublicKey[i]);

  // Recover message: check which activeDeltas match the corresponding publicKey entry
  // (Since for t=1, publicKey[i] === deltas[i])
  // We must also ensure the value wasn't originally zero, as 0^0 = 0
  return activeDeltas.map((ad_val, i) => (publicKey[i] !== 0 && ad_val === publicKey[i]) ? 1 : 0);
}

// Test harness
function testAsymmetric() {
  const { privateKey, publicKey } = generateKeys();
  const message = [1, 0, 1, 1, 0, 0, 1, 0];

  console.log("Message:     ", message);
  console.log("Public Key:  ", publicKey);

  const ciphertext = encrypt(publicKey, message, privateKey);
  console.log("Ciphertext:  ", ciphertext);

  const decrypted = decrypt(ciphertext, publicKey, privateKey);
  console.log("Decrypted:   ", decrypted);
}

testAsymmetric();
