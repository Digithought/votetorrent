import { BlockId, BlockStore } from "../blocks";
import { ITreeNode } from "./nodes";
import { TreeBlock } from "./tree-block";

export interface ITreeTrunk {
	/** Gets the root node of the tree */
	get(): Promise<ITreeNode>;
	/** Sets the root node of the tree */
	set(node: ITreeNode): Promise<void>;
	/** Gets the root node id of the tree */
	getId(): Promise<BlockId>;
}

export type getTrunkFunc = (store: BlockStore<TreeBlock>, rootId: BlockId, newId?: BlockId) => ITreeTrunk;
