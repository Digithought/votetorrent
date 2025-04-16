# CARVE: Cellular Automata for Reversible Vector Encryption

## Abstract

CARVE (Cellular Automata for Reversible Vector Encryption) is a novel symmetric encryption scheme based on a lattice of local reversible machines—one per bit or word of the message. Unlike traditional block ciphers built on algebraic structures, CARVE leverages a time-evolving, hash-guided cellular automaton model with trapdoor-governed reversibility. This approach enables high-diffusion, key-dependent transformations that are deterministic in the forward direction and reversible only by entities possessing the secret key. CARVE provides a non-algebraic foundation for symmetric encryption, potentially resistant to both classical and quantum cryptanalytic methods.

## 1. Introduction

Classical symmetric ciphers like AES and ChaCha rely on substitution-permutation networks and algebraic mixing to achieve diffusion and confusion. CARVE proposes a different path: using a distributed system of micro-computational units (cells) that evolve their state in parallel over time, each governed by a local rule set influenced by a shared secret key.

In CARVE, the message is mapped to a linear array of cells, each with an internal register and bit state. The lattice evolves over a fixed number of time steps using lossy forward operations whose behavior is keyed via cryptographic hash functions. Reversibility is achieved not by inverting the loss, but by re-running the same keyed decision logic in reverse—ensuring that only holders of the shared secret can regenerate the plaintext.

## 2. Design Overview

### 2.1 Core Concepts

- **Lattice:** A one-dimensional array of `n` cells, each representing a bit and a register.
- **Forward Execution:** At each time step `t`, each cell updates its state by applying a secret-guided lossy transformation, incorporating information from its immediate neighbors.
- **Reversibility:** The forward steps are not bijective but are deterministically driven by a keyed hash oracle. Reverse execution replays these decisions to reconstruct prior states.
- **Symmetric Reversibility:** The same secret key is used for both encryption and decryption. There is no public-private key distinction.

### 2.2 Components

- **Cell:**
  - `bit`: the cell’s primary data bit
  - `register`: an internal 8-bit register for local state

- **Key:**
  - A shared secret used to seed the keyed hash oracle
  - Determines how the system evolves over time

- **Parameters:**
  - Initialization values for all registers at time `t = 0`
  - Execution depth `t`

### 2.3 Transition Functions

Forward and reverse transformations are deterministic functions that depend on:

- Cell index `i`
- Step `t`
- Neighboring bits and registers
- Hash of (`secret`, `i`, `t`, and local context)

These are used to:
- Select transformation rules (e.g., bit overwrite, XOR, rotation)
- Determine how and where data is lost in forward mode
- Regenerate lost data in reverse using the same hash oracle

## 3. Encryption

Given:
- `plaintext_bits[0..n-1]`
- `init_registers[0..n-1]`
- `Key`
- `t`: number of time steps

Encryption proceeds as follows:

1. Map each plaintext bit to a cell with the corresponding initial register.
2. For each step `s` from `0` to `t-1`, apply `forwardStep(i, s)` to every cell `i`, using current and neighbor state.
3. Return the final cell state (bit + register) as ciphertext.

## 4. Decryption

## 4.1 Pseudocode Implementation

Below is simplified pseudocode for encryption and decryption in the CARVE system.

### Encryption

```python
function encrypt(bits, registers, key, t):
    state = [Cell(bit=bits[i], register=registers[i]) for i in range(len(bits))]

    for step in range(t):
        new_state = []
        for i in range(len(state)):
            left = state[(i - 1) % len(state)]
            right = state[(i + 1) % len(state)]
            decision = hash(key, step, i, state[i], left, right)
            new_cell = forward_step(state[i], left, right, decision)
            new_state.append(new_cell)
        state = new_state

    return state
```

### Decryption

```python
function decrypt(ciphertext, key, t):
    state = ciphertext.copy()

    for step in reversed(range(t)):
        prev_state = []
        for i in range(len(state)):
            left = state[(i - 1) % len(state)]
            right = state[(i + 1) % len(state)]
            decision = hash(key, step, i, state[i], left, right)
            recovered_cell = reverse_step(state[i], left, right, decision)
            prev_state.append(recovered_cell)
        state = prev_state

    return [cell.bit for cell in state]
```

### Notes:
- `hash()` represents a deterministic cryptographic hash function (e.g., SHAKE128).
- `forward_step()` and `reverse_step()` are dual operations whose behavior is keyed by the hash output.
- Neighbor access is wraparound.
- The same hash input must be used in both directions for reversibility.

## 4. Decryption

Given:
- `ciphertext_cells[0..n-1]`
- `Key`
- `t`: number of time steps

Decryption proceeds as:

1. Set state to ciphertext cells.
2. For each step `s` from `t-1` to `0`, apply `reverseStep(i, s)` to every cell `i` using current and neighbor state.
3. Output the recovered bit values from the final state.

## 5. Security Considerations

- **Key-Secrecy Dependence:** The keyed hash oracle ensures only the keyholder can predict or reconstruct lossy transformations.
- **High Diffusion:** All bits are affected each round due to neighbor interaction.
- **No Algebraic Structure:** Lacks exploitable field or group properties found in traditional ciphers.
- **Resistance to Known Attacks:** No known differential or linear attack strategies apply due to hash-based transformation selection.
- **Quantum Resistance:** If using a post-quantum secure hash, CARVE offers plausible resistance to quantum adversaries.

## 6. Implementation Notes

- Hash oracle must be fast and cryptographically secure (e.g., SHAKE128, Blake3).
- Registers may be extended to 16-bit or structured state for added complexity.
- Wraparound (modular) indexing simplifies boundary conditions.
- Parallelism-friendly due to the per-cell independence of operations.

## 7. Applications and Extensions

- **Post-quantum symmetric encryption**
- **Parallel stream encryption for constrained devices**
- **Cryptographic steganography**
- **Trapdoor-based obfuscation primitives**
- **Self-synchronizing ciphers over communication channels**

## 8. Future Work

- Formal security analysis (IND-CPA, IND-CCA scenarios)
- Avalanche and diffusion testing across rounds
- Resistance to known-plaintext and chosen-ciphertext attacks
- Parameter tuning for register size and step count
- Hardware-oriented designs (e.g., FPGA-friendly gate nets)

## 9. Conclusion

CARVE introduces a fundamentally different structure for symmetric encryption—built from time-evolving, reversible computation over a cellular lattice. Its use of secret-deterministic hash oracles for reversible loss introduces a novel trapdoor dynamic, promising both theoretical richness and practical value. We invite further cryptanalysis, implementation, and refinement.
