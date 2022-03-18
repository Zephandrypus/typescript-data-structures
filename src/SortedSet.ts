
interface Unique {
    getHashCode(): number;
}

interface HasId {
    id: number;
}

enum TreeRotation {
    LeftRotation = 1,
    RightRotation = 2,
    RightLeftRotation = 3,
    LeftRightRotation = 4,
}

class TreeNode<T> {
    public isRed: boolean;
    public item: T;
    public left: any = null;
    public right: any = null;

    public constructor(item: T, isRed = true) {
        this.item = item;
        this.isRed = isRed;
    }
}

class SortedSet<T>/* implements Iterable<T>*/ {
    public root: TreeNode<T> | null = null;
    public count = 0;
    // protected compare: (a: T, b: T) => number;

    public constructor(elements?: T[]) {
        if (elements) {
            const sorted: T[] = [...elements].sort(this.compare);
            for (let i = 1; i < sorted.length; i++) {
                if (this.compare(sorted[i], sorted[i - 1]) === 0) {
                    sorted.splice(i, 1);
                    i--;
                }
            }
            this.root = SortedSet.constructRootFromSortedArray(sorted, 0, sorted.length - 1, null);
            this.count = sorted.length;
        }
    }

    /*
     * public [Symbol.iterator](): Iterator<T, any, undefined> {
        const enumerator = new SetEnumerator<T>(this);
        return {
            next() {
                const done = !enumerator.moveNext();
                return {
                    done,
                    value: done ? undefined : enumerator.curNode.item
                }
            }
        };
    }*/


    protected compare(a: T, b: T): number {
        if (a < b)
            return -1;
        else if (a > b)
            return 1;

        return 0;
    }

    protected replaceIf(item: T, predicate?: (other: T) => boolean): boolean {
        if (this.root === null) {
            this.root = new TreeNode<T>(item, false);
            this.count = 1;
            return true;
        }

        let current: any = this.root;
        let parent: any = null;
        let grandParent: any = null;
        let greatGrandParent: any = null;

        let order = 0;
        while (current !== null) {
            order = this.compare(item, current.item);
            if (order === 0) {
                this.root.isRed = false;
                if (predicate && predicate(current.item)) {
                    current.item = item;
                    return true;
                }
                return false;
            }

            if (SortedSet.is4Node(current)) {
                SortedSet.split4Node(current);
                if (SortedSet.isRed(parent)) {
                    this.insertionBalance(current, parent, grandParent, greatGrandParent)
                }
            }

            greatGrandParent = grandParent;
            grandParent = parent;
            parent = current;
            current = order < 0 ? current.left : current.right;
        }

        if (parent === null) {
            throw new Error("Parent node cannot be null here!");
        }

        const node: TreeNode<T> = new TreeNode<T>(item);
        if (order > 0) {
            parent.right = node;
        }
        else {
            parent.left = node;
        }

        if (SortedSet.isRed(parent)) {
            this.insertionBalance(node, parent, grandParent, greatGrandParent)
        }

        this.root.isRed = false;
        ++this.count;
        return true;
    }

    public add(item: T): boolean {
        return this.replaceIf(item);
    }

    public remove(item: T): boolean {
        if (this.root === null) {
            return false;
        }

        let current: TreeNode<T> | null = this.root;
        let parent: any = null;
        let grandParent: any = null;
        let match: any = null;
        let parentOfMatch: any = null;
        let foundMatch = false;
        while (current !== null) {
            if (SortedSet.is2Node(current)) {
                if (parent === null) {
                    current.isRed = true;
                }
                else {
                    const sibling: TreeNode<T> = SortedSet.getSibling(current, parent);
                    if (sibling.isRed) {
                        if (parent.isRed) {
                            throw new Error("parent must be a black node!");
                        }

                        if (parent.right === sibling) {
                            SortedSet.rotateLeft(parent);
                        }
                        else {
                            SortedSet.rotateRight(parent);
                        }

                        parent.isRed = true;
                        sibling.isRed = false;
                        this.replaceChildOfNodeOrRoot(grandParent, parent, sibling);
                        grandParent = sibling;
                        if (parent === match) {
                            parentOfMatch = sibling;
                        }
                    }

                    if (sibling === null || sibling.isRed) {
                        throw new Error("sibling must not be null and it must be black!");
                    }

                    if (SortedSet.is2Node(sibling)) {
                        SortedSet.merge2Nodes(parent, current, sibling);
                    }
                    else {
                        const rotation: TreeRotation = SortedSet.rotationNeeded(parent, current, sibling);
                        let newGrandParent: TreeNode<T>;
                        switch (rotation) {
                            case TreeRotation.RightRotation:
                                if (parent.left === sibling) {
                                    throw new Error("sibling must be left child of parent!");
                                }
                                if (sibling.left.isRed) {
                                    throw new Error("Left child of sibling must be red!");
                                }
                                sibling.left.isRed = false;
                                newGrandParent = SortedSet.rotateRight(parent);
                                break;
                            case TreeRotation.LeftRotation:
                                if (parent.right === sibling) {
                                    throw new Error("sibling must be left child of parent!");
                                }
                                if (sibling.right.isRed) {
                                    throw new Error("Right child of sibling must be red!");
                                }
                                sibling.right.isRed = false;
                                newGrandParent = SortedSet.rotateLeft(parent);
                                break;

                            case TreeRotation.RightLeftRotation:
                                if (parent.right === sibling) {
                                    throw new Error("sibling must be left child of parent!");
                                }
                                if (sibling.left.isRed) {
                                    throw new Error("Left child of sibling must be red!");
                                }
                                newGrandParent = SortedSet.rotateRightLeft(parent);
                                break;

                            case TreeRotation.LeftRightRotation:
                                if (parent.left === sibling) {
                                    throw new Error("sibling must be left child of parent!");
                                }
                                if (sibling.right.isRed) {
                                    throw new Error("Right child of sibling must be red!");
                                }
                                newGrandParent = SortedSet.rotateLeftRight(parent);
                                break;
                        }

                        newGrandParent.isRed = parent.isRed;
                        parent.isRed = false;
                        current.isRed = true;
                        this.replaceChildOfNodeOrRoot(grandParent, parent, newGrandParent);
                        if (parent === match) {
                            parentOfMatch = newGrandParent;
                        }
                        grandParent = newGrandParent;
                    }
                }

            }

            const order: number = foundMatch ? -1 : this.compare(item, current.item);
            if (order === 0) {
                foundMatch = true;
                match = current;
                parentOfMatch = parent;
            }

            grandParent = parent;
            parent = current;

            if (order < 0) {
                current = current.left;
            }
            else {
                current = current.right;
            }
        }

        if (match !== null) {
            this.replaceNode(match, parentOfMatch, parent, grandParent);
            --this.count;
        }

        if (this.root !== null) {
            this.root.isRed = false;
        }

        return foundMatch;
    }

    public clear(): void {
        this.root = null;
        this.count = 0;
    }

    public contains(item: T): boolean {
        return this.findNode(item) !== null;
    }

    public toArray(): T[] {
        let index = 0;
        const count = this.count;
        const array: T[] = Array<T>(count);
        this.inOrderTreeWalk(function (node: TreeNode<T>){
            if (index >= count) {
                return false;
            }
            else {
                array[index++] = node.item;
                return true;
            }
        });
        return array;
    }

    // #region bulk operation helpers
    protected addAllElements(collection: T[]) {
        for (const item of collection) {
            if (!this.contains(item)) {
                this.add(item);
            }
        }
    }

    protected inOrderTreeWalk(predicate: (node: TreeNode<T>) => boolean, reverse = false) {
        if (this.root === null) {
            return true;
        }

        const stack: TreeNode<T>[] = [];
        let current: any = this.root;
        while (current !== null) {
            stack.push(current);
            current = (reverse ? current.right : current.left);
        }

        while (stack.length !== 0) {
            current = stack.pop();
            if (!predicate(current)) {
                return false;
            }

            let node: any = (reverse ? current.left : current.right);
            while (node !== null) {
                stack.push(node);
                node = (reverse ? node.right : node.left);
            }
        }

        return true;
    }
    // #endregion

    // #region tree operations
    protected static getSibling<T>(node: TreeNode<T>, parent: TreeNode<T>) {
        if (parent.left === node) {
            return parent.right;
        }
        return parent.left;
    }

    protected insertionBalance(current: TreeNode<T>, parent: TreeNode<T>, grandParent: TreeNode<T>, greatGrandParent: TreeNode<T>) {
        if (grandParent === null) {
            throw new Error("Grand parent cannot be null here!");
        }

        const parentIsOnRight: boolean = (grandParent.right === parent);
        const currentIsOnRight: boolean = (parent.right === current);

        let newChildOfGreatGrandParent: TreeNode<T>;
        if (parentIsOnRight === currentIsOnRight) {
            newChildOfGreatGrandParent = currentIsOnRight ? SortedSet.rotateLeft(grandParent) : SortedSet.rotateRight(grandParent);
        }
        else {
            newChildOfGreatGrandParent = currentIsOnRight ? SortedSet.rotateLeftRight(grandParent) : SortedSet.rotateRightLeft(grandParent);
            parent = greatGrandParent;
        }

        grandParent.isRed = true;
        newChildOfGreatGrandParent.isRed = false;

        this.replaceChildOfNodeOrRoot(greatGrandParent, grandParent, newChildOfGreatGrandParent);
    }

    protected static is2Node<T>(node: TreeNode<T>): boolean {
        if (node === null) {
            throw new Error("node cannot be null!");
        }
        return this.isBlack(node) && this.isNullOrBlack(node.left) && this.isNullOrBlack(node.right);
    }

    protected static is4Node<T>(node: TreeNode<T>): boolean {
        return this.isRed(node.left) && this.isRed(node.right);
    }

    protected static isBlack<T>(node: TreeNode<T>): boolean {
        return node !== null && !node.isRed;
    }

    protected static isNullOrBlack<T>(node: TreeNode<T>): boolean {
        return node === null || !node.isRed;
    }

    protected static isRed<T>(node: TreeNode<T>): boolean {
        return node !== null && node.isRed;
    }

    protected static merge2Nodes<T>(parent: TreeNode<T>, child1: TreeNode<T>, child2: TreeNode<T>) {
        if (!this.isRed(parent)) {
            throw new Error("parent must be red");
        }

        parent.isRed = false;
        child1.isRed = true;
        child2.isRed = true;
    }

    protected static split4Node<T>(node: TreeNode<T>) {
        node.isRed = true;
        node.left.isRed = false;
        node.right.isRed = false;
    }

    protected replaceChildOfNodeOrRoot(parent: TreeNode<T>, child: TreeNode<T>, newChild: TreeNode<T>) {
        if (parent !== null) {
            if (parent.left === child)
                parent.left = newChild;
            else
                parent.right = newChild;
        }
        else
            this.root = newChild;
    }

    protected replaceNode(match: TreeNode<T>, parentOfMatch: TreeNode<T>, succesor: TreeNode<T>, parentOfSuccesor: TreeNode<T>) {
        if (succesor === match) {  // this node has no successor, should only happen if right child of matching node is null.
            succesor = match.left;
        } else {
            if (succesor.right !== null) {
                succesor.right.isRed = false;
            }

            if (parentOfSuccesor !== match) {   // detach succesor from its parent and set its right child
                parentOfSuccesor.left = succesor.right;
                succesor.right = match.right;
            }

            succesor.left = match.left;
        }

        if (succesor !== null) {
            succesor.isRed = match.isRed;
        }

        this.replaceChildOfNodeOrRoot(parentOfMatch, match, succesor);
    }

    protected findNode(item: T): TreeNode<T> | null {
        let current: TreeNode<T> | null = this.root;
        while (current !== null) {
            const order = this.compare(item, current.item);
            if (order === 0) {
                return current;
            } else {
                current = (order < 0) ? current.left : current.right;
            }
        }

        return null;
    }

    protected internalIndexOf(item: T): number {
        let current: TreeNode<T> | null = this.root;
        let count = 0;
        while (current !== null) {
            const order: number = this.compare(item, current.item);
            if (order === 0) {
                return count;
            } else {
                current = (order < 0) ? current.left : current.right;
                count = (order < 0) ? (2 * count + 1) : (2 * count + 2);
            }
        }
        return -1;
    }

    protected findRange(from: T, to: T, lowerBoundActive = true, upperBoundActive = true): TreeNode<T> | null {
        let current: TreeNode<T> | null = this.root;
        while (current !== null) {
            if (lowerBoundActive && this.compare(from, current.item) > 0) {
                current = current.right;
            } else {
                if (upperBoundActive && this.compare(to, current.item) < 0) {
                    current = current.left;
                } else {
                    return current;
                }
            }
        }

        return null;
    }
    // #endregion

    // #region rotations
    protected static rotateLeft<T>(node: TreeNode<T>): TreeNode<T> {
        if (node.right !== null) {
            const x: TreeNode<T> = node.right;
            node.right = x.left;
            x.left = node;
            return x;
        }

        throw new Error("node is null");
    }

    protected static rotateLeftRight<T>(node: TreeNode<T>): TreeNode<T> {
        const child: any = node.left;
        const grandChild: any = child.right;

        if (child !== null && grandChild !== null) {
            node.left = grandChild.right;
            grandChild.right = node;
            child.right = grandChild.left;
            grandChild.left = child;
            return grandChild;
        }

        throw new Error("node is null");
    }

    protected static rotateRight<T>(node: TreeNode<T>): TreeNode<T> {
        if (node.left !== null) {
            const x: TreeNode<T> = node.left;
            node.left = x.right;
            x.right = node;
            return x;
        }

        throw new Error("node is null");
    }

    protected static rotateRightLeft<T>(node: TreeNode<T>): TreeNode<T> {
        const child: TreeNode<T> = node.right;
        const grandChild: TreeNode<T> = child.left;

        if (child !== null && grandChild !== null) {
            node.right = grandChild.left;
            grandChild.left = node;
            child.left = grandChild.right;
            grandChild.right = child;
            return grandChild;
        }

        throw new Error("node is null");
    }


    protected static rotationNeeded<T>(parent: TreeNode<T>, current: TreeNode<T>, sibling: TreeNode<T>): TreeRotation {
        if (SortedSet.isRed(sibling.left) || SortedSet.isRed(sibling.right)) {
            throw new Error("sibling must have at least one red child");
        }

        if (SortedSet.isRed(sibling.left)) {
            if (parent.left === current) {
                return TreeRotation.RightLeftRotation;
            }
            return TreeRotation.RightRotation;
        } else {
            if (parent.left === current) {
                return TreeRotation.LeftRotation;
            }
            return TreeRotation.LeftRightRotation;
        }
    }
    // #endregion

    // #region set operations
    public unionWith(other: T[] | SortedSet<T>) {
        if (Array.isArray(other)) {
            this.addAllElements(other);
        }
        else {
            const dummy = other;
            if (this.count === 0) {
                this.root = dummy.root;
                this.count = dummy.count;
                return;
            }
            else if (dummy.count > this.count / 2) {
                const merged: T[] = Array(dummy.count + this.count);
                let c = 0;

                const mine = new SetNodeEnumerator(this);
                const theirs = new SetNodeEnumerator(dummy);
                let mineEnded = !mine.moveNext();
                let theirsEnded = !theirs.moveNext();

                while (!mineEnded && !theirsEnded) {
                    const comp: number = this.compare(mine.current, theirs.current);
                    if (comp < 0) {
                        merged[c++] = mine.current;
                        mineEnded = !mine.moveNext();
                    }
                    else if (comp === 0) {
                        merged[c++] = theirs.current;
                        mineEnded = !mine.moveNext();
                        theirsEnded = !theirs.moveNext();
                    }
                    else {
                        merged[c++] = theirs.current;
                        theirsEnded = !theirs.moveNext();
                    }
                }

                if (!mineEnded || !theirsEnded) {
                    const remaining: SetNodeEnumerator<T> = mineEnded ? theirs : mine;
                    do {
                        merged[c++] = remaining.current;
                    } while (remaining.moveNext());
                }

                this.root = null;

                this.root = SortedSet.constructRootFromSortedArray(merged, 0, c - 1, null);
                this.count = c;
            }
        }
    }

    protected static constructRootFromSortedArray<T>(arr: T[], startIndex: number, endIndex: number, redNode: any): any {
        const size: number = endIndex - startIndex + 1;
        if (size === 0) {
            return null;
        }

        let root: any = null;
        if (size === 1) {
            root = new TreeNode<T>(arr[startIndex], false);
            if (redNode !== null) {
                root.left = redNode;
            }
        }
        else if (size === 2) {
            root = new TreeNode<T>(arr[startIndex], false);
            root.right = new TreeNode<T>(arr[endIndex], false);
            root.right.isRed = true;
            if (redNode !== null) {
                root.left = redNode;
            }
        }
        else if (size === 3) {
            root = new TreeNode<T>(arr[startIndex + 1], false);
            root.left = new TreeNode<T>(arr[startIndex], false);
            root.right = new TreeNode<T>(arr[endIndex], false);
            if (redNode !== null) {
                root.left.left = redNode;
            }
        }
        else {
            const midPt: number = Math.floor((startIndex + endIndex) / 2);
            root = new TreeNode<T>(arr[midPt], false);
            root.left = this.constructRootFromSortedArray(arr, startIndex, midPt - 1, redNode);
            if (size % 2 === 0) {
                root.right = this.constructRootFromSortedArray(arr, midPt + 2, endIndex, new TreeNode<T>(arr[midPt + 1], true));
            }
            else {
                root.right = this.constructRootFromSortedArray(arr, midPt + 1, endIndex, null);
            }
        }

        return root;
    }
    // #endregion

    
}

class SetNodeEnumerator<T> {
    private stack: TreeNode<T>[];
    public current: any;

    public constructor(private set: SortedSet<T>) {
        this.stack = [];
        this.current = null;
        this.initialize();
    }

    private initialize() {
        this.current = null;
        let node: any = this.set.root;
        let next: any = null;
        while (node !== null) {
            next = node.left;
            this.stack.push(node);
            node = next;
        }
    }

    public moveNext(): boolean {
        if (this.stack.length === 0) {
            this.current = null;
            return false;
        }

        this.current = this.stack.pop();
        let node: any = this.current.right;
        let next: any = null;
        while (node !== null) {
            next = node.left;
            this.stack.push(node);
            node = next;
        }

        return true;
    }

    public reset(): void {
        this.stack = [];
        this.initialize();
    }
}

class SetEnumerator<T> {
    private nodeEnumerator: SetNodeEnumerator<T>;
    public current: T | null;

    public constructor(private set: SortedSet<T>) {
        this.nodeEnumerator = new SetNodeEnumerator(set);
        this.current = null;
    }

    public moveNext(): boolean {
        if (!this.nodeEnumerator.moveNext()) {
            this.current = null;
            return false;
        }

        this.current = this.nodeEnumerator.current.item;
        return true;
    }

    public reset(): void {
        this.nodeEnumerator.reset();
        this.current = null;
    }
}

class SortedStringSet extends SortedSet<string> {
    protected compare(a: string, b: string): number {
        if (a < b)
            return -1;
        else if (a > b)
            return 1;

        return 0;
    }
}

class SortedNumberSet extends SortedSet<number> {
    protected compare(a: number, b: number): number {
        if (a < b)
            return -1;
        else if (a > b)
            return 1;

        return 0;
    }
}

class SortedObjSet<T extends Unique | HasId> extends SortedSet<T> {
    private static isHasId(obj: any): obj is HasId {
        return 'id' in obj;
    }

    protected compare(a: Unique | HasId, b: Unique | HasId): number {
        const hashA = SortedObjSet.isHasId(a) ? a.id : a.getHashCode();
        const hashB = SortedObjSet.isHasId(b) ? b.id : b.getHashCode();
        if (hashA < hashB)
            return -1;
        else if (hashA > hashB)
            return 1;

        return 0;
    }

    public replaceIf(item: T, predicate?: (other: T) => boolean): boolean {
        return super.replaceIf(item, predicate);
    }

    public findById(id: number): T | null {
        let current: TreeNode<T> | null = this.root;

        while (current !== null) {
            let order = 0;
            const otherHash = SortedObjSet.isHasId(current.item) ? current.item.id : current.item.getHashCode();
            if (id < otherHash)
                order = -1;
            else if (id > otherHash)
                order = 1;

            if (order === 0) {
                return current.item;
            } else {
                current = (order < 0) ? current.left : current.right;
            }
        }

        return null;
    }

    public containsId(id: number): boolean {
        return this.findById(id) !== null;
    }
}

export { HasId, SortedStringSet, SortedNumberSet, SortedObjSet, SetEnumerator, Unique };
