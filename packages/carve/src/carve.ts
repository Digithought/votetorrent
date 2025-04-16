// carve.ts
import crypto from 'crypto';

export interface Cell {
	bit: number;
	register: number;
}

export class Carve {
	key: string;
	t: number;

	constructor(key: string, t: number) {
		this.key = key;
		this.t = t;
	}

	private hash(...inputs: (string | number)[]): number {
		const str = inputs.join(':');
		const hash = crypto.createHash('sha256').update(str).digest();
		return hash[0];
	}

	private forwardStep(cell: Cell, left: Cell, right: Cell, decision: number): Cell {
		const newBit = decision % 2 === 0 ? cell.bit ^ left.bit : cell.bit ^ right.bit;
		const newReg = (cell.register + decision) % 256;
		return { bit: newBit, register: newReg };
	}

	private reverseStep(cell: Cell, left: Cell, right: Cell, decision: number): Cell {
		const prevBit = decision % 2 === 0 ? cell.bit ^ left.bit : cell.bit ^ right.bit;
		const prevReg = (cell.register - decision + 256) % 256;
		return { bit: prevBit, register: prevReg };
	}

	encrypt(bits: number[], registers: number[]): Cell[] {
		let state: Cell[] = bits.map((bit, i) => ({ bit, register: registers[i] }));

		for (let step = 0; step < this.t; step++) {
			const newState: Cell[] = [];
			for (let i = 0; i < state.length; i++) {
				const left = state[(i - 1 + state.length) % state.length];
				const right = state[(i + 1) % state.length];
				const decision = this.hash(this.key, step, i, state[i].bit, left.bit, right.bit, state[i].register);
				newState.push(this.forwardStep(state[i], left, right, decision));
			}
			state = newState;
		}

		return state;
	}

	decrypt(ciphertext: Cell[]): number[] {
		let state: Cell[] = JSON.parse(JSON.stringify(ciphertext));

		for (let step = this.t - 1; step >= 0; step--) {
			const prevState: Cell[] = [];
			for (let i = 0; i < state.length; i++) {
				const left = state[(i - 1 + state.length) % state.length];
				const right = state[(i + 1) % state.length];
				const decision = this.hash(this.key, step, i, state[i].bit, left.bit, right.bit, state[i].register);
				prevState.push(this.reverseStep(state[i], left, right, decision));
			}
			state = prevState;
		}

		return state.map(cell => cell.bit);
	}
}