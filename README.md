#VoteTorrent
Crowd voting protocol and reference application.

See [End-user Frequently Asked Questions](doc/user-faq.md)

See [Figma Wireframes](https://www.figma.com/proto/egzbAF1w71hJVPxLQEfZKL/Mobile-App?node-id=53-865&t=b6kRPTs8TXLtsWgk-1)

## Glossary of Terms:

* Administrator - a person who, in combination with the other administrators, is authorized to act on behalf of an authority.
* Authority - district or entity involved in the voting process
  * Election Authority - the authority describing the overall event and timetable
  * Registration Authority - an authority charged with tracking registered voters
  * Ballot Authority - a district level authority with a specific ballot template to be voted on in an election 
  * Certification Authority - an authority that certifies the result of each ballot question per election
* Ballot Template - a declaration of a specific questionnaire pertaining to a Ballot Authority and Election.
* Block - batch of voters and votes, with scrambled ordering so votes aren't related to voters.  Has been hashed and uniqueness validated.
* DHT/Kademlia - Distributed Hash Table - network used to communicate and transact on a peer-to-peer basis (no central server)
* District - a geographic area represented by a Ballot Authority
* Election - declaration of a pending voting event, containing the cut-off times, and associated rules
* Outcome - the tallied results of a given ballot within an election
* Pool - a forming block - not fully mature
* Registration - list of eligible voters, maintained by an authority or peer to peer network
* Stakeholders - the authority, usually the voters, and any other parties who are privy to the voter registration and vote outcome
* Seed - an initial block of three anonymously formed voters/votes
* Timestamp Authority - a trusted third party that provides a timestamp


## Overall Requirements:

* Election authority can advertise and revise election including timeframes and keyholders
* The list of registered voters could be fixed at start of election, or grow until closing
* District authorities can publish and revise ballot templates
* Registrant includes a public key, public attributes and private attributes, but hashes of both are part of voter record to ensure no tampering
* Authority may retain actual private information on voters
* The stakeholders can see public portion of voter registration
* Voter can vote without the authority, peers, or any other party knowing for which candidate
* During the release phase, keyholders will publish their private keys
* Voter can verify presence and correctness of his or her vote
* Stakeholders can verify that only eligible voters voted
* Stakeholders can verify the final tally
* Stakeholders can tell which voters voted, but not what the individual vote was
* No party should be able to vote on behalf of the voter - there may be restrictions on how far this is possible
* Results should not be visible to the authority or stakeholders until resolution opens at the end of the voting period

## Physical Components

* Directory Network ("Directory") - Peer-to-peer network based on Kademlia DHT
  * Scope: Global
  * Directly Stores: authority records
  * Timeline: records represent geographic election districts
  * Node types: Client only (mobile app on mobile network or limited storage), limited (wired or wifi network and some storage), processing (server or cloud service - long term storage)
    * Processing and bootstrap nodes:
      * User: press, municipalities, etc.
      * Facilitates:
        * Incoming connections from mobile apps and NAT traversal
        * Stability and robustness of the DHT
        * Archival of election results
* Election Network - Peer-to-peer network based on Kademlia DHT
  * Scope: Election wide (e.g. per state)
  * Directly Stores: election related records
  * Timeline: records maintained during election period
  * Node types: Client only, limited, processing
* Voter mobile app
  * User: voters
  * Connects to: DHT
  * Facilitates: registration, voting, validation, and viewing results
* Authority mobile app
  * User: election administrators
  * Connects to: DHT
  * Facilitates: creation and revisioning of elections, ballot templates, and keyholding
* Private registration database (optional)
  * User: election authority
  * Facilitates: storage of private registration information
  * Facilitates: validation that private CID matches stored information
  * Interface: Rest API

## Processes

### Voters register
  * Global Directory P2P network facilitates finding authorities and Election Networks
  * Voter receives or finds public key of registration authority
    * Could come from a QR, NFC, deep-link, or:
    * Could be looked up from the directory:
      * Based on user's location
      * Authorities are enumerated from the Directory
        * Q: How can spatial information be represented on a DHT?
        * Q: How are the authority records stored, updated, and discovered on the Directory network?  In IPFS?  Is there some form of (Merkle) tree?
      * Authority records are signed using their CA certificates to verify authenticity
  * Voter generates key pair:
    * Biometrics used to generate key pair in hardware vault
    * Private key never leaves device
    * Voter may be allowed to add entropy to randomness
    * Can be shown QR visualization of public key - can optionally print for easier recovery
  * Voter submits required public information
    * Variation 1 - submitted to authority, who signs it and pushes to public registration on IPFS
    * Variation 2 - submitted to public registration on IPFS with only self-signature
      * Q: Voter shouldn't be sole provider of their public registration information.  How does the authority become a secondary provider for all registration data?
    * Optional: video interview including questions and presentation of documents
  * Voter submits required private information
    * Goes to authority only, who signs it and gives the voter a signature and CID (voter can also independently verify CID hash)
  * Authority could should operate at least one bootstrap / peer processing server

### Authority creates an election
  * Records created in Authority App
    * Immutable part includes revision cut-off date, timestamp authorities, core date, and title
    * Revisable part includes keyholders, timeline, and instructions
  * Signed by authority's administrators
  * Election is published:
    * Authority publishes a pub-sub topic for announcing new and modified elections
    * Election is published to the DHT
      * Q: IPFS or just a published topic on the Election Network?

### Authority invites keyholders
  * Invitation includes election record and fellow invitees, as well as an expiration date
  * Announced via pub-sub topic on Election Network, and deep-link can be sent via traditional channels (e.g. email)
  * Typically, a keyholder will not use a personal device for this duty, but rather will use a dedicated device which is then stored in a secure location
  * Using the Authority App, the keyholder accepts by:
    * Generating an election specific key pair (private key may not be held in hardware vault because it must be releasable)
    * Election private key is encrypted using biometric-backed, in-hardware registration private key - unencrypted key not persisted
    * The encrypted private key is stored on the device
    * Keyholder record is signed using the registrant's private key
    * Keyholder record is published to the Election Network

### The election is revised
  * At the end of the keyholder acceptance period, there is a keyholder revision period, during which the election is revised to include the accepted keyholder records.
  * Additional revisions may be made up to the statically stated deadline
  * Using the authority app, an administrator constructs a revision record
    * Revisions must bear independent timestamps from TSAs declared in the immutable election record - this proves that the revision occurred before the deadline
    * Creator signs it, and sends to other administrators for signature.
      * Q: How is this communicated and stored?
    * Election revision is signed by other authority's administrator(s)
  * Once fully signed, revision is published to the Election Network via a pub-sub topic, and is updated in the Election Network

### Voter votes
  * Election app checks that a vote hasn't already been submitted by the user's registrationKey
    * If it has, the app has lost it's state or the voter's private key has been compromised.  The app should load the voter record and update (and persist) it's local state.  Without the nonce, the vote record cannot be retrieved - perhaps the user is allowed to manually enter their nonce for retrieval.
  * App shows an election level combined ballot, made from district-level ballot templates
  * For each district-level ballot, app randomly generates a _vote nonce_
  * User inputs selections, with dependent questions appearing or disappearing based on user's selections
  * Review
    * User reviews their selections and can revise them before submitting
    * The user is shown the vote nonces and are allowed to copy them and add entropy to them
  * User submits vote:
    * Answers are split on a per-district basis - match ballot templates
    * The vote and voter records (including nonces) are persisted locally and held privately by voter.  Nonce allows voter to verify presence of vote in election results
    * The app displays progress (per-district)
    * App generates a _vote entry_, consisting of:
      * Answers (vote proper)
      * Vote nonce
    * App generates a _voter entry_ consisting of:
      * Public registrant key
      * Public and private registrant CIDs
      * Optional information:
        * Location
        * Device ID
        * Device attestation
      * Registrant's signature of the entry and the template's CID
    * Block negotiation begins - see Block Negotiation below

### Vote hashing
  * Immediately following voting, there is a brief accruing period during which votes may no longer be submitted, the time is allowed for transactions to settle
  * After the accruing period, the votes are hashed into a Merkle tree, which forms a single, deterministic accounting of all blocks
  * Q: How is this coordinated?
  * Q: Where is this stored and cached?

### Election unlocked
  * If any private keys held by a keyholder are released prior to the Releasing Keys portion of the election, a validation record is created by that party, capturing the private key and the timestamp, and is submitted as part of election validation
  * During the Releasing Keys portion of the election, each of the keyholders must publish his or her private election key
    * Using the Authority App, the keyholder uses biometrics to unlock the private key they hold
    * The private key is then published to the Election Network along with timestamp(s) from TSA(s)

### Election tallied
  * With all keyholders private keys released, the vote and voter records within each block are all decryptable by anyone, using the combination private keys
  * Nodes coordinate to create a tally tree, corresponding to the Merkle tree of hashes of the blocks, but including a histogram of results at each level
  * Each node of the built tree should be signed by the nodes that created it, and be timestamped by TSAs
  * Q: How is this coordinated?
  * Q: Where is this stored and cached?
  * The root entry of the Tally tree is published as the raw outcome for the election
  * Q: What happens if there are a very large number of different answers (e.g. text answers, write-ins with variations)
  * Q: How does the completion of tree formation get turned reliably into a single pub-sub notification?

### Validation
  * Each voter should, but is not required to, participate in slice level verification
  * A subset of nodes (e.g. media and election authorities) should do more comprehensive validation
  * Slice level validation includes:
    * My vote entry is in an included block and is unaltered
    * My voter entry is in the same included block, and the signature valid
    * The block is unaltered (hash matches)
    * The block is included in branches through the root of the Tally tree, and each such node is consistent
    * Problems getting connected or participating in the Election Network - even transient connection problems should be reported for statistical purposes
    * Q: Any other validation checks without more global data?
  * Comprehensive validation includes:
    * Validate every block:
      * Count of voters matches count of votes
      * Voter signatures are valid
      * Votes are valid: can be unencrypted and answers valid
    * Validate every Tally and Merkle tree node: histograms and hashes are correct
    * All records from authorities are properly signed and timed appropriately
  * Both successful and failed validations are added to a build report that is built and stored on the Election Network.  Any failed validation should include whatever proof can be given
  * The built report should suggest an error margin for the election, as well as provide other statistical information
  * Q: How is this built and stored?

### Certification
  * Based on the validation report and tally results, each ballot authority publishes a certification of the election outcome
  * Using the Authority App, a positive or negative certification record is generated and signed by the administrator(s)
  * The certification is pushed via pubsub and stored on the Election Network
  * Q: How specifically is this built and stored?

## Block Negotiation

The apps should join the DHT networks in the background, and remain as an active node during the active election period.

Blocks are negotiated as follows, from the perspective of a given node:

### Pair finding
* A pairing public/private key pair is generated, with the private key kept accessible (not locked in hardware vault)
* A clock delta is established relative to an NTP server - this allows us to estimate latency from peers in one hop
* Subscribe to an Election Network pub-sub topic based on the template CID, and a 'seeding' token.
  * Initially the pairing token is based on several of the most significant digits of a hash of the registrantKey (Q: good to have this content based, but not sure if we can do that quite yet) 
* Upon joining the topic, send an `present` message to the topic, with our Peer ID, adjusted time, and multiaddress
* Wait for at least an accumulation time (if accumulation count messages arrive), and at most a timeout period, for topic messages from other peers
* For each `present` message received from the pubsub, send a `greet` message, directly to the least n latent peers, with our Peer ID, time, multiaddress, and pairing public key
* If we receive a `greet` message: 
  * If its apparent latency is less than any of the peers we have encountered, respond with a `pair` message containing:
    * Our voter and vote records completely encrypted using the combined public key of both nodes
    * The pairing public key
  * Otherwise respond with a `reject` message
* If our outgoing `greet` message(s) timeout or are rejected, go to the next n latent peers and repeat
* If we receive a `pair` message, we should check that it's round-trip latency reasonably matches the estimated one hop latency, if so, and we have accepted no other pairings, the pairing is complete and we proceed to the next step, otherwise we respond with a `reject` message
* Keep track of rejected peers, and if we get to a latency that would make the rejected peer the least latent, attempt a `greet` again
* If we encounter no other peers after the maximum timeout period, continue "listening" on this topic, but subscribe to the next most general topic pairing token, announce our presence, and repeat
  * A `greet` message from a more specific topic node should supersede a lower response time (up to some limit) 
* If we get to the root token (empty), and the voting period is elapsing, we must form a unitary block and submit it

### Seeding
At the end of pair finding, one node should have the encrypted vote and voter records from the other node, as well as the pairing public key of the other node.  We'll call this node the pair coordinator.

* The coordinator will completely encrypt its own voter and vote records and form a "seed", with the combined voter and vote records in scrambled order relative to each other.
* In a manner similar to pair finding, the coordinator attempts to find either a 3rd peer or another coordinator node to form a "pool".
  * The `present` and `greet` messages are sent as above
  * Rather than sending a `pair` message, however, a `pool` message is sent containing the seed, the coordinator's private key, and the non-coordinator's public key and multiaddress
  * If we, as a node, receive a `pool` message, we should:
    * Send a `confirm` message to the non-coordinator peer indicated in the message, containing the non-coordinator's public key
    * Wait for a `confirmation` message from the non-coordinator peer containing the non-coordinator's private key
    * Decrypt the seed using the non-coordinator and coordinator's combined private keys
    * Combine the voter and vote records from the seed with our own voter and vote records, scrambling the order of each list independently, forming a pool
    * We become the pool coordinator, and we inform all contributing peers that they are in the pool
    * If we don't receive an `ack` message from one or more peers within a timeout period, we revert to our previous state and `inform` all contributing peers that we did

### Pool Merging
* As pool coordinator, we subscribe to an election network pub-sub topic based on the template CID, a 'pooling' token, and a hash of the pool
* Similar to pairing, we start with a more specific token and move to a more general one, announce our presence, and try to find other pool coordinators
* `present` messages in this topic include the current pool size, and the pool coordinator's multiaddress
* `greet` messages include reciprocal size information, followed by a `merge` message
* At completion of each merge, all contributing peers are `inform`ed of the new pool size and the pool coordinator's multiaddress
  * Any nodes not acknowledging cause the merge to be reverted with follow up `inform` messages - including which peer(s) did not acknowledge
  * Q: Perhaps nodes should track pool and seed revisions, and potentially drop repeat offenders.  Should this also be wispered?  Announced via pubsub?
* If pool size reaches a capacity margin, or the period is ending, the pool coordinator sends a `form` message to all contributors to announce block formation
  * This message includes a CID, representing the hash of the records portion of the block
  * All peers should check that:
    * The CID is correct
    * The records include the unaltered

## Validation Process

* Note that a late block should only constitute a validation failure if it was submitted with sufficient time to complete.
* Validation anomaly records may include a premature disclosure of an election private key, signed with a TSA to prove early release.
* Election revisions match
* Keys were released, and in time
* Authorities may wish to host a client node to ensure that their notification duties (e.g. revisions, and signature release) are properly received.

## Runoff Elections

Runoff elections are a crucial mechanism to ensure fair and accurate results in cases where the initial election outcome is uncertain or contested. The following describes the generation of runoffs and the rules governing them:

1. Runoff Trigger Conditions:
   a. Discrepancy Margin: If the number of disputed votes (peers with receipt but voter and/or voter not included in the final tally) exceeds the spread between the top candidates, a runoff is assumed.
   b. Voter Accessibility Issues: If a significant portion (defined as a ratio) of voters report inability to access the voting system, a runoff is assumed. This is determined by the rules configured in the ElectionRevision record, which define a threshold of accessibility issues.  Any claim of unreachability should be verified by subsequent validators, and can be negated with evidence (presentation of voter record)
   c. Close Results: If the margin of victory is within a predefined threshold (e.g., 1% of total votes), a runoff may be automatically triggered.

2. Runoff Rules:
   a. Timing: Runoffs are scheduled at a predefined interval after the initial election, as specified in the ElectionRevision interface.
   b. Participants: Only the top two candidates from the initial election participate in the runoff, unless the election rules specify otherwise.
   c. Voter Eligibility: All voters eligible in the initial election are eligible to participate in the runoff.

3. Validation Chain:
   a. Result Hash: The validation chain must include a hash of the election results. All participants and validators must report relative to this hash to ensure consistency.
   b. Block Inclusion: The authority must provide cryptographic proof of inclusion for all received blocks in the final tally.
   c. Timestamping: External timestamping of received blocks is required to prevent retroactive exclusion.

4. Dispute Resolution:
   a. Objective Disputes: Disagreements on voter signatures, voter-to-registrant matching, or vote counts can be resolved objectively by referring to the hashed result.
   b. Subjective Issues: Voter-reported accessibility problems are tracked and, if exceeding a threshold, may trigger a runoff.

5. Anti-Manipulation Measures:
   a. Peer Validation: A diverse set of peers must validate the results to prevent coordinated false reporting.
   b. Escalation Process: Disputes that cannot be resolved through peer validation are escalated to a predefined arbitration process.

6. Transparency Requirements:
   a. Public Auditing: The authority must provide a public, auditable log of all received blocks and their inclusion in the final tally.
   b. Multiple Result Prevention: The authority is required to commit to a single result hash, preventing the publication of multiple, disagreeing results.

These rules aim to balance the need for definitive results with the importance of addressing legitimate concerns about election integrity. They provide a structured approach to handling disputes and ensuring that runoffs are triggered only when necessary to maintain the fairness and accuracy of the election process.

## Attack Vectors & Limits

* There is no way for peers to verify the claim of a missing vote record by another peer.  Even if the peer discloses their vote nonce, there is not way for other peers, without the authority's private key and without being in that voter's block pool, to verify the claim.
* Invalid voter (someone not registered) tries to participate.  May be included in blocks causing them to be rejected.
    * Mitigation: Subset of peers can consult registration list before agreeing to block - could be downloaded with election, stored on a blockchain or accessed via API
    * Mitigation: If peers receive block failure for unregistered voter that they bother to verify, could add the physical (IP address) information about such parties to the exception list in the validation phase.
* Attacker manages to negotiate into multiple blocks.  E.g. None of the original peers are around later.  Block is rejected with “duplicate voter”.
    * Mitigation: Peers can renegotiate new blocks.  This occurs during resolution phase, so there should be plenty of peers
* Melicious apps/devices
* One or more voter’s private keys are sold or stolen
* Voter may be only one remaining, may have to submit own block - the authority will know who’s vote it was.
* If time is running out on resolution and multiple block negotiations have failed, voter may have to submit singular block - this reveals their vote to the authority


## Assumptions

* Authority is responsible to ensure that only authorized voters are registered
    * In-person registration
    * Mailed cards
* Authority is responsible to ensure that the correct party holds the private key associated with voting record


## Components

* Authority Frontend - Web application
    * Home page & static content
    * Registrations list - self serve
    * Administer registration
    * Administer election
    * Administer confirmed election
    * Elections
        * Status - current and archive
            * Phase - registration - registrations
            * Phase - voting - registrations
            * Phase - resolution - tally and registrations
            * Phase - validation - stats and exceptions
* Authority Backend - Nodejs serverless
    * APIs - each returning time information:
        * Post registrant
        * Get registrant - public
        * Post election
        * Get elections(s)
        * Promote election to confirmed
        * Get confirmed status
        * Get confirmed results
        * Post block
    * Database
* Device Frontend - React native?
    * Entry
        * Registration deep link
        * Election deep link
        * General introduction
    * Register
        * Enter required demographics
        * Optional: Capture picture
        * Generate key
            * Optional: Enter entropy
            * Stored in OS vault
        * Submit registration
            * Failure: report
            * Success: Store information from authority
    * Authorities
        * Get from local list
    * Authority
        * Show elections from authority
    * Election
        * Display terms, timetables, etc.
        * Show whether signature is valid
        * Vote:
            * Show voting content markdown
            * Embed candidates / questions
            * Ability to pull up details on each, pulled from embedded content or from authority
        * Submit to peers:
            * Show status - connecting, negotiating, block ready
        * See results
            * Show my validation
            * Show community validation
    * Background service
* Device Backend - Ecmascript module
    * Local database
    * Add registration (authority)
    * Update elections (& check time sync)
    * Get election
        * Validate
    * Prepare vote and voter entries
    * Voting state machine - DHT
        * Connecting
        * Finding peers
        * Negotiating
        * Block ready
        * Submitting
        * Submitted
        * Validating
        * Validated
        * Failed
    * Get election results
    * Get validation info


## Architecture Notes:

* Standard JSON format for all major objects
* Validations are Javascript snippets, scoped to relevant object
* Markdown for content embeddings


## Notes:

* App should not use complex UX idioms.  Most should read as left to right text


## Future work:

* Allow authority to be a separate blockchain
* Separate voter roles from authority
