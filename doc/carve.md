# CARVE: Cellular Automata for Reversible Vector Encryption

## Introduction

This document introduces CARVE (Cellular Automata for Reversible Vector Encryption), a novel, post-quantum asymmetric cryptographic scheme that uniquely combines cellular automata (CA) with hash-based reversibility mechanisms. CARVE achieves public-key encryption through inherently lossy forward cellular automaton execution, while the private key enables cryptographically secure reverse computation. Its asymmetric nature provides robust security properties, making CARVE naturally resistant to known quantum threats and suitable for emerging distributed cryptographic applications.

## System Overview

CARVE employs two distinct keys:

- **Public Key**: A randomly generated initial state for cellular automaton registers (publicly known).
- **Private Key**: Secret random seed for cryptographic hash functions, used exclusively during decryption to resolve reversibility ambiguities.

Encryption executes a forward CA operation publicly, while decryption reverses this operation using private hash-driven decisions.

## Theoretical Foundations

### Asymmetry via Hash-Governed Reversibility

CARVE achieves cryptographic asymmetry by introducing deliberate lossy operations during the forward (public) execution of CA. These losses introduce ambiguity that is impossible to reverse without additional secret information. The private key, which seeds a cryptographic hash function, acts as a trapdoor permitting deterministic reversal of these lossy operations.

### Diffusion and Security

CARVE provides strong diffusion properties, ensuring a minor plaintext change affects the ciphertext extensively (avalanche effect). Lossy XOR operations and neighborhood exchanges rapidly propagate changes throughout the cellular automaton.

## Related Work

Previous cellular automaton cryptography mostly involved symmetric constructions, reversible rules, or simple XOR-based ciphers. CARVE uniquely leverages the combination of irreversible forward transformations and hash-driven reversible backward transformations, placing it distinctly in asymmetric cryptography territory, unlike Feistel and traditional symmetric ciphers.

## Detailed CARVE Construction

### Keys and Initialization

- **Public Key**: Random initial register state at t=0.  $t$ should also be included with this if it is not fixed for the specific algorithm.
- **Private Key**: Random seed for hash.

### Forward Operation (Encryption)

Plaintext bits populate external bits. The forward execution proceeds deterministically:

```pseudo
// For each cell i, at each time step (parallel execution)
// Exchange bits with neighbors (wrap-around)
temp_left  = R[i][0]
temp_right = R[i][1]
R[i][0]    = R[i-1][2]
R[i][1]    = R[i+1][3]

// Internal lossy mixing
R[i][2] ^= R[i][0] ^ external_bit[i]
R[i][3]  = rotate_left(R[i][3], 1) // rotate bits left cyclically by 1

// Update external bit (producing ciphertext)
external_bit[i] = R[i][1] XOR R[i][2]
```

*Note: `rotate_left` cyclically shifts bits left by one position.*

After exactly `t` steps, the final global state (external + internal bits) constitutes the ciphertext.

### Reverse Operation (Decryption)

Decryption is only possible by resolving lossy operations using the private key:

```pseudo
// Undo external bit
R[i][1] = external_bit[i] XOR R[i][2]

// Undo internal lossy mixing using hash-derived decisions
hash_bit = H(private_key || global_t_counter || cell_index)[bit_for_cell_i_at_step_t]
R[i][3]  = rotate_right(R[i][3], 1) // cyclically shift bits right by 1
R[i][2] ^= R[i][0] ^ external_bit[i] ^ hash_bit

// Undo neighbor exchange
R[i-1][2] = R[i][0]
R[i+1][3] = R[i][1]
```

Thus, knowledge of the private key is essential for deterministic reversal.

## Parameter Selection and Tuning

Key size, number of cells, and step count (`t`) directly influence CARVE’s security and performance:

- **Private key length**: At least 256 bits recommended for strong quantum resistance.
- **Step count (`t`)**: Typically 32–128, increasing `t` enhances security by maximizing diffusion and reversibility complexity.
- **Cell count**: Dictated by plaintext size, larger cells improve diffusion but add computational cost.

## Benefits and Limitations

### Benefits:
- Robust post-quantum security due to asymmetric, hash-driven trapdoor structure.
- High parallelism suitable for hardware (GPU/FPGA) implementations.
- Flexible threshold cryptography integration due to natural key partitioning.

### Limitations:
- Computational cost dominated by repeated hash operations.
- Requires careful implementation to maintain performance.

## Contributions to Distributed and Programmable Cryptography

CARVE naturally facilitates threshold cryptography through distributed key and state management. Each step’s hash decisions can be collaboratively computed among key-share holders, offering built-in flexibility for secure multi-party computation and distributed encryption scenarios.

## Summary and Future Work

CARVE, as an asymmetric encryption system based on cellular automata and hash-driven reversibility, provides a novel pathway for secure cryptographic applications. Future research should rigorously analyze cryptanalytic resistance, optimize computational efficiency, explore multi-dimensional CA implementations, and investigate deeper integration with multi-party cryptographic frameworks.

In conclusion, CARVE stands as a promising asymmetric cryptographic primitive suitable for next-generation, quantum-resistant security systems.

