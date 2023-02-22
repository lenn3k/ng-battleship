export interface Cell {
  x: number;
  y: number;
  hit?: boolean;
  miss?: boolean;
  type?: string;
  count?: number;
  prob?: number;
  sunk?: boolean;
}

export interface Enemy {
  targetStack: Cell[];
  mode: 'HUNT' | 'KILL';
  targetList: Cell[];
}


  /**
   * Utility method to deep-copy objects
   * @param element object to copy
   */
  export function copy<T>(element: T): T {
    return JSON.parse(JSON.stringify(element));
  }
