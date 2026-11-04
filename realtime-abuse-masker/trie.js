class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  // Phase 1: Population
  insert(word) {
    let current = this.root;
    // Normalize to lowercase before inserting
    for (const char of word.toLowerCase()) {
      if (!current.children[char]) {
        current.children[char] = new TrieNode();
      }
      current = current.children[char];
    }
    current.isEndOfWord = true;
  }

  // Helper: Identifies spaces, punctuation, and string edges
  isWordBoundary(char) {
    if (char === undefined) return true; // Edge of the string
    // Matches spaces and common punctuation
    return /[\s.,!?;:'"()\[\]{}\-_]/.test(char);
  }

  // Phase 2: Scanning and Masking
  censor(text) {
    let chars = text.split('');
    let i = 0; // Pointer A (The Start)

    while (i < chars.length) {
      // 1. Left Boundary Check
      // Only start scanning if Pointer A is at the beginning of a word
      let leftChar = i > 0 ? chars[i - 1] : undefined;
      if (!this.isWordBoundary(leftChar)) {
        i++;
        continue;
      }

      let current = this.root;
      let j = i; // Pointer B (The Explorer)
      let longestMatchLength = 0;
      let foundMatch = false;

      // 2. The Sliding Window Traversal
      while (j < chars.length) {
        let char = chars[j].toLowerCase(); // Normalize input on the fly
        
        if (!current.children[char]) {
          break; // Dead end in the Trie
        }
        
        current = current.children[char];
        
        // 3. The Match and Right Boundary Check
        if (current.isEndOfWord) {
          let rightChar = j + 1 < chars.length ? chars[j + 1] : undefined;
          
          if (this.isWordBoundary(rightChar)) {
            longestMatchLength = j - i + 1;
            foundMatch = true;
            // We do not break immediately, so we can catch longer variants
            // (e.g., catching "foolish" even after matching "fool")
          }
        }
        j++;
      }

      // 4. The Masking Execution
      if (foundMatch) {
        for (let k = 0; k < longestMatchLength; k++) {
          chars[i + k] = '*';
        }
        i += longestMatchLength; // Jump Pointer A past the masked word
      } else {
        i++; // Move Pointer A forward by 1 character
      }
    }

    // Reconstruct the finalized string
    return chars.join('');
  }
}

module.exports = Trie;