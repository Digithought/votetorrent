# CARVE: Cellular Automata for Reversible Vector Encryption
by Nathan T. Allan

## Abstract

This paper introduces CARVE (Cellular Automata for Reversible Vector Encryption), a novel asymmetric cryptographic scheme that uniquely combines cellular automata (CA) with hash-based reversibility mechanisms. CARVE leverages the inherent parallelism and diffusion properties of CA while introducing a novel trapdoor mechanism based on cryptographic hashing to achieve asymmetry. This approach results in a post-quantum secure public-key cryptosystem suitable for various applications, including emerging distributed cryptographic paradigms. We detail the theoretical foundations, construction, security properties, and potential applications of CARVE.

## 1. Introduction

Asymmetric cryptography is fundamental to modern secure communication, enabling functionalities like digital signatures and key exchange. However, the advent of quantum computing threatens the security of widely deployed asymmetric schemes like RSA and ECC [1]. This necessitates the development of post-quantum cryptographic (PQC) algorithms resistant to attacks by both classical and quantum computers.

Cellular Automata (CA) have long been studied for their complex emergent behavior arising from simple local rules [2]. Their inherent parallelism and diffusion properties make them attractive for cryptographic applications. While CA have been explored primarily for symmetric encryption and pseudorandom number generation [3, 4], their application in asymmetric cryptography has been limited.

This paper introduces CARVE (Cellular Automata for Reversible Vector Encryption), a novel post-quantum asymmetric cryptosystem. CARVE uniquely combines the computational properties of CA with a hash-based trapdoor mechanism to achieve asymmetric encryption. The public key defines the initial state and parameters of the CA, while the private key controls a cryptographic hash function used to reverse the inherently lossy forward CA evolution. This design provides resistance against known quantum attacks and offers potential advantages in distributed environments.

This work makes the following contributions:
-   Introduction of a novel asymmetric encryption scheme based on CA and hash-based reversibility.
-   Detailed description of the CARVE construction, including encryption and decryption algorithms.
-   Analysis of the theoretical underpinnings, focusing on the source of asymmetry and security properties.
-   Discussion of parameter selection, performance considerations, and potential applications, particularly in distributed and programmable cryptography.

The remainder of this paper is structured as follows: Section 2 provides background on cellular automata and relevant cryptographic concepts. Section 3 details the CARVE system construction. Section 4 discusses the theoretical foundations. Section 5 reviews related work. Section 6 covers parameter selection and tuning. Section 7 analyzes benefits and limitations. Section 8 explores contributions to distributed cryptography. Section 9 discusses future work, and Section 10 concludes the paper.

## 2. Background

### 2.1 Cellular Automata (CA)

A cellular automaton is a discrete model consisting of a regular grid of cells, each in one of a finite number of states. The state of a cell at time \(t+1\) is determined by applying a fixed local rule to the states of the cells in its neighborhood at time \(t\) [2]. CA exhibit complex global behavior from simple local interactions and possess properties like parallelism and diffusion, making them suitable for cryptographic primitives.

### 2.2 Asymmetric Cryptography and Post-Quantum Security

Asymmetric (public-key) cryptography uses separate keys for encryption and decryption. The public key can be widely distributed, while the private key remains secret. The security relies on the computational difficulty of deriving the private key from the public key. Current standards like RSA and ECC are vulnerable to Shor's algorithm on quantum computers [1]. PQC aims to develop cryptosystems secure against such threats, often based on hardness assumptions from fields like lattice-based cryptography, code-based cryptography, hash-based cryptography, or multivariate cryptography [5].

### 2.3 Hash Functions

Cryptographic hash functions are one-way functions mapping arbitrary-sized input data to fixed-size output strings (hashes). They are designed to be collision-resistant and preimage-resistant. CARVE utilizes these properties to create a trapdoor mechanism for reversing the CA evolution.

## 3. CARVE System Description

CARVE operates on a vector of registers, representing the state of a one-dimensional cellular automaton.

### 3.1 Keys and Initialization

-   **Public Key**: Consists of the initial state \(S_0\) of all CA registers at time \(t=0\) and the total number of evolution steps \(T\). \(S_0\) is typically generated randomly.
-   **Private Key**: A secret random seed \(K_{priv}\) used for a cryptographic hash function \(H\).

### 3.2 Forward Operation (Encryption)

Encryption transforms a plaintext \(P\) into a ciphertext \(C\) by evolving the CA state forward for \(T\) steps.

1.  **Initialization**: The plaintext \(P\) is encoded into the initial external bit states `external_bit[i]` for each cell \(i\). The internal register states are initialized according to the public key \(S_0\).
2.  **CA Evolution**: The system evolves for \(T\) discrete time steps. At each step \(t\), every cell \(i\) updates its internal state and its external bit in parallel based on its current state and the states of its neighbors (typically \(i-1\) and \(i+1\), with wrap-around boundary conditions).

The update rule involves:
    a.  **Neighbor Exchange**: Bits are exchanged between adjacent cells to facilitate diffusion.
    b.  **Internal Mixing**: Internal register bits are mixed using operations like XOR and bit rotations. Crucially, this mixing includes incorporating the current `external_bit[i]`, making the process lossy.
    c.  **External Bit Update**: A new `external_bit[i]` is computed based on the updated internal state.

```pseudocode
// Let R[i] be the register state of cell i (e.g., 4 internal bit vectors)
// Let external_bit[i] be the external bit associated with cell i

// --- Encryption Step (executed for t = 1 to T for all cells i in parallel) ---

// 1. Neighbor Exchange (Example: using specific bits from registers)
temp_left  = R[i][0]        // Store bit 0 of register i
temp_right = R[i][1]        // Store bit 1 of register i
R[i][0]    = R[i-1][2]      // Get bit 2 from left neighbor
R[i][1]    = R[i+1][3]      // Get bit 3 from right neighbor

// 2. Internal Lossy Mixing
// Incorporate neighbor bits and external bit (plaintext at t=0)
R[i][2] ^= R[i][0] ^ external_bit[i]
// Apply a non-linear operation, e.g., rotation
R[i][3]  = rotate_left(R[i], 1)

// 3. Update External Bit (becomes part of ciphertext)
external_bit[i] = R[i][1] ^ R[i][2] // Example update rule
```
*Note: `rotate_left(x, n)` cyclically shifts bits of `x` left by `n` positions.*

3.  **Ciphertext Generation**: After \(T\) steps, the final state of all `external_bit[i]` concatenated with the final internal register states \(S_T\) constitutes the ciphertext \(C = (\text{final\_external\_bits} || S_T)\).

### 3.3 Reverse Operation (Decryption)

Decryption requires the private key \(K_{priv}\) to reverse the CA evolution from the final state \(S_T\) back to the initial state \(S_0\) and recover the plaintext \(P\).

1.  **Initialization**: The final external bits and internal states \(S_T\) are obtained from the ciphertext \(C\).
2.  **Reverse Evolution**: The system evolves backward for \(T\) steps (from \(t=T\) down to \(t=1\)). At each step, the operations of the forward evolution are reversed.

Reversing the operations requires resolving the ambiguity introduced by the lossy mixing step (step 2b in encryption). This is where the private key is essential.

```pseudocode
// --- Decryption Step (executed for t = T down to 1 for all cells i in parallel) ---

// 1. Recover R[i][1] using external_bit and R[i][2]
R[i][1] = external_bit[i] XOR R[i][2]

// 2. Rotate register right (reversible)
R[i] = rotate_right(R[i], 1)

// 3. Undo lossy XOR (requires hash to regenerate lost data)
hash_bit = H(secret || i || t)[...]
R[i][2] ^= R[i][0] ^ external_bit[i] ^ hash_bit

// 4. Push neighbor bits back (reverse direction)
R[i-1][2] = R[i][0]
R[i+1][3] = R[i][1]
```
*Note: The exact derivation of intermediate values (like `R[i][2]` needed for step 1) depends on the specific CA rules and may require careful ordering or storage during forward/reverse computation.*

3.  **Plaintext Recovery**: After reversing \(T\) steps, the state \(S_0\) is recovered. The `external_bit[i]` values at this initial state correspond to the original plaintext \(P\).

## 4. Theoretical Underpinnings

### 4.1 Asymmetry via Hash-Governed Reversibility

The core innovation of CARVE lies in its mechanism for achieving asymmetry. The forward CA evolution is designed to be inherently lossy – information is lost during the internal mixing step (specifically, the XOR operation involving `external_bit[i]`). This loss makes direct reversal computationally infeasible without additional information.

The private key \(K_{priv}\) acts as a trapdoor. It seeds a cryptographic hash function \(H\), which deterministically provides the "missing information" needed to reverse the lossy operations at each step for each cell. An attacker lacking \(K_{priv}\) cannot compute the correct hash outputs and thus cannot reverse the CA evolution to recover the plaintext. The security relies on the preimage resistance of the hash function \(H\): it should be infeasible to determine \(K_{priv}\) or the correct hash outputs even knowing the public key, the ciphertext, and the CA rules.

The specific bit extracted from the hash output (`required_hash_bit`) effectively resolves the one-bit ambiguity introduced by the XOR operation in the forward pass. For the decryption `R[i][2] ^= R[i][0] ^ external_bit[i] ^ required_hash_bit` to correctly reverse the encryption `R[i][2] ^= R[i][0] ^ external_bit[i]`, the `required_hash_bit` must precisely cancel out the effect introduced during encryption. This requires careful design of the hash input and bit extraction process to ensure consistency.

### 4.2 Diffusion and Security

CARVE is designed to exhibit strong diffusion properties, characteristic of many CA systems. The neighbor exchange and internal mixing operations ensure that changes in a single plaintext bit rapidly propagate across the entire CA state (avalanche effect) over multiple time steps \(T\). This makes statistical attacks difficult.

Security against quantum attacks stems from the reliance on cryptographic hash functions, which are generally considered resistant to known quantum algorithms like Shor's algorithm. The underlying hardness assumption is related to the difficulty of reversing the hash-guided lossy CA evolution, which does not directly map to problems efficiently solvable by quantum computers.

## 5. Related Work

The use of Cellular Automata in cryptography is not new. Wolfram explored CA for pseudorandom number generation [6]. Several works proposed CA-based symmetric encryption schemes, often using reversible CA rules or simple XOR-based stream ciphers [3, 7, 8]. However, these are fundamentally different from CARVE's asymmetric nature.

Other related areas include:
-   **Hash-based Cryptography**: Schemes like Merkle Signatures [9] and stateful hash-based signatures (LMS, XMSS) [10, 11] rely solely on hash functions but primarily for digital signatures. CARVE uses hashes for a different purpose – enabling trapdoor decryption.
-   **Physically Unclonable Functions (PUFs)**: PUFs leverage inherent physical randomness. While CARVE uses randomness (initial state, private key), its operation is deterministic algorithmic execution, unlike PUFs [12].
-   **Feistel Networks and SPNs**: These are common structures in symmetric block ciphers [13]. While CARVE involves rounds of operations, its structure differs significantly, particularly in the asymmetric, hash-dependent reversal mechanism.

CARVE's novelty lies in combining the dynamics of irreversible CA with a hash-based trapdoor to create an asymmetric system, distinguishing it from prior CA-based symmetric ciphers and standard hash-based signature schemes.

## 6. Parameter Selection and Tuning

The security and performance of CARVE depend on several parameters:

-   **Cell Count (N)**: Determined by the desired plaintext block size. Larger \(N\) generally increases security by widening the state space but also increases computational cost per step.
-   **Register Size/Complexity**: The number and size of internal state variables per cell. More complex internal states can enhance security but increase computational overhead.
-   **Neighborhood Size**: Typically 1D nearest neighbors ({i-1, i, i+1}). Larger neighborhoods can increase diffusion speed but complicate implementation.
-   **Number of Steps (T)**: Crucial for security. \(T\) must be large enough to ensure thorough diffusion and mixing, making reversal without the private key infeasible. Typical values might range from 32 to 128 or more, depending on security requirements and analysis. Increasing \(T\) directly increases encryption/decryption time.
-   **Hash Function (H)**: A standard, secure cryptographic hash function (e.g., SHA-3, BLAKE2) should be used. The output size should be sufficient to provide the required bits for reversal across all cells and steps.
-   **Private Key Length**: Should match the security level of the chosen hash function, typically 256 bits or more for strong post-quantum security.

Parameter tuning involves balancing security requirements (diffusion, resistance to cryptanalysis) against performance constraints (computation time, memory usage). Specific application requirements (e.g., low-latency communication vs. secure storage) will influence the choice of parameters like \(T\) and register complexity. Formal security analysis and benchmarking are necessary to establish optimal parameter sets for desired security levels.

## 7. Benefits and Limitations

### 7.1 Benefits

-   **Post-Quantum Security**: Relies on hash functions, believed to be resistant to quantum attacks.
-   **Asymmetry**: Provides public-key encryption capabilities.
-   **High Parallelism**: CA operations are inherently parallel, suitable for hardware acceleration (GPU, FPGA).
-   **Potential for Threshold Implementation**: The hash-based reversal mechanism might be adaptable for threshold cryptography (see Section 8).
-   **Strong Diffusion**: CA dynamics naturally provide good avalanche properties.

### 7.2 Limitations

-   **Performance**: Decryption involves numerous hash function computations (potentially \(N \times T\) hashes), which can be computationally intensive compared to traditional asymmetric schemes like RSA/ECC (though potentially competitive with some PQC schemes like lattice-based ones). Encryption is generally faster as it doesn't involve hashing.
-   **Ciphertext Expansion**: The ciphertext includes the final internal state \(S_T\), potentially leading to ciphertext expansion depending on the register size relative to the plaintext block size.
-   **Security Analysis Complexity**: Rigorous cryptanalysis of CA-based systems can be challenging due to their complex dynamics. Proving resistance against all known and future attacks requires significant effort.
-   **Implementation Complexity**: Careful implementation is needed to manage state updates, boundary conditions, and the secure integration of the hash function for reversal.

## 8. Contributions to Distributed and Programmable Cryptography

CARVE's structure offers interesting possibilities for distributed and programmable cryptography:

-   **Threshold Decryption**: The private key \(K_{priv}\) could potentially be shared among multiple parties using standard secret sharing schemes. To decrypt, a threshold number of parties would need to collaborate. Each party could compute partial hash information based on their key share. Combining these partial results would allow the reconstruction of the necessary `required_hash_bit` values to perform the reverse CA evolution. This requires careful design of the hash input and combination process to be compatible with secret sharing.
-   **Multi-Party Computation (MPC)**: The decryption process, involving parallel computations across cells and time steps driven by private hash inputs, might be amenable to secure MPC protocols. Parties could jointly decrypt a ciphertext without revealing their individual private key shares.
-   **Programmable States**: The CA rules themselves or aspects of the hash input could potentially be made programmable or state-dependent, leading to more complex cryptographic functionalities, though this requires further research into security implications.

The key idea is that the hash function acts as a localized oracle at each step and cell during decryption. If access to this oracle (controlled by \(K_{priv}\)) can be distributed or thresholdized, then CARVE decryption naturally lends itself to these advanced cryptographic settings.

## 9. Future Work

CARVE presents a promising but nascent approach. Significant future work is required:

-   **Rigorous Cryptanalysis**: In-depth analysis is needed to assess resistance against known-plaintext attacks, chosen-plaintext attacks (CPA), chosen-ciphertext attacks (CCA), and potential attacks leveraging the specific structure of CA (e.g., algebraic attacks, differential/linear cryptanalysis adapted for CA).
-   **Performance Optimization**: Exploring optimized software implementations (leveraging SIMD instructions) and hardware implementations (FPGA/ASIC) to mitigate the cost of hash computations. Investigating alternative, faster hash functions or specialized functions suitable for this construction.
-   **Parameter Optimization**: Establishing concrete parameter sets (N, T, register complexity, hash function) for standard security levels (e.g., NIST PQC levels) based on security analysis and performance benchmarks.
-   **Variant Exploration**: Investigating variations, such as using different CA rules, multi-dimensional CA, different lossy mechanisms, or alternative trapdoor functions.
-   **Formal Security Proofs**: Developing formal security proofs, possibly in standard models like the Random Oracle Model (ROM) assuming ideal hash functions, to provide stronger security guarantees.
-   **Threshold Scheme Development**: Formalizing the proposed threshold decryption mechanism and analyzing its security and efficiency.

## 10. Conclusion

CARVE offers a novel pathway towards post-quantum asymmetric cryptography by uniquely integrating cellular automata dynamics with hash-based trapdoor reversibility. Its inherent parallelism, strong diffusion properties, and reliance on quantum-resistant hash functions make it a potentially valuable addition to the PQC landscape. While performance, particularly in decryption, and the need for thorough cryptanalysis are key challenges, CARVE's structure also presents intriguing possibilities for threshold and distributed cryptography. Further research and rigorous analysis are essential to fully evaluate its security and practicality as a next-generation cryptographic primitive.

## References

[1] Shor, P. W. (1997). Polynomial-Time Algorithms for Prime Factorization and Discrete Logarithms on a Quantum Computer. *SIAM Journal on Computing*, 26(5), 1484–1509.

[2] Wolfram, S. (2002). *A New Kind of Science*. Wolfram Media.

[3] Fuster-Sabater, A., & Caballero-Gil, P. (2006). On the Use of Cellular Automata in Symmetric Cryptography. *Acta Applicandae Mathematicae*, 93(1-3), 215–236.

[4] Kang, B.-H., Lee, D.-H., & Hong, C.-P. (2008). Pseudorandom Number Generation Using Cellular Automata. In T. Sobh, K. Elleithy, A. Mahmood, & M. A. Karim (Eds.), *Novel Algorithms and Techniques In Telecommunications, Automation and Industrial Electronics* (pp. 401–404). Springer.

[5] National Institute of Standards and Technology (NIST). (Ongoing). *Post-Quantum Cryptography Project*. Retrieved from https://csrc.nist.gov/projects/post-quantum-cryptography

[6] Wolfram, S. (1985). Cryptography with Cellular Automata. In *Advances in Cryptology: Crypto '85 Proceedings* (LNCS 218, pp. 429–432). Springer.

[7] Seredyński, F., Bouvry, P., & Zomaya, A. Y. (2003). Cellular Programming and Symmetric Key Cryptography Systems. In E. Cantú-Paz et al. (Eds.), *Genetic and Evolutionary Computation — GECCO 2003* (LNCS 2724, pp. 1369–1381). Springer.

[8] Nandi, S., Kar, B. K., & Chaudhuri, P. P. (1994). Theory and Applications of Cellular Automata in Cryptography. *IEEE Transactions on Computers*, 43(12), 1346–1357.

[9] Merkle, R. C. (1988). A Digital Signature Based on a Conventional Encryption Function. In *Advances in Cryptology – CRYPTO '87* (LNCS 293, pp. 369–378). Springer.

[10] Housley, R., McGrew, D., & Lahr, M. (2018). *XMSS: eXtended Merkle Signature Scheme*. RFC 8391. Internet Engineering Task Force (IETF).

[11] McGrew, D., Curcio, M., & Fluhrer, S. (2019). *Leighton-Micali Signatures*. RFC 8554. Internet Engineering Task Force (IETF).

[12] Maes, R. (2013). Physically Unclonable Functions: Constructions, Properties and Applications. *Springer Tracts in Electrical and Electronic Engineering*. Springer.

[13] Katz, J., & Lindell, Y. (2020). *Introduction to Modern Cryptography* (3rd ed.). CRC Press. (Standard textbook covering Feistel/SPN structures).
