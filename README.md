
# Syllogimous v4: RFT Trainer

Syllogimous v4 is a cognitive training platform built on Relational Frame Theory (RFT).  
It presents structured tasks that target logical reasoning, pattern recognition, and relational thinking.

---

## Task Types

### 1. Distinction  
*Identity and Equivalence Relations*

- **Function**: Trains same/different discrimination and basic categorization.
- **RFT Frames**: Coordination (sameness) and distinction (difference).
- **Example**:  
  `A is the same as B`  
  `B is different from C`  
  → What is the relation between A and C?

---

### 2. Syllogism  
*Classical Logical Reasoning*

- **Function**: Trains deductive reasoning and evaluation of validity.
- **RFT Frames**: Relational networks with quantifiers (e.g., all, some, none).
- **Example**:  
  `All X are Y`  
  `Some Y are Z`  
  → Is a given conclusion logically valid?

---

### 3. Comparison (Numerical / Chronological)  
*Quantitative and Temporal Relations*

- **Function**: Trains magnitude comparison and temporal ordering.
- **RFT Frames**: Comparative frames (more-than / less-than, before / after).
- **Example**:  
  `A > B`  
  `B > C`  
  → What is the relation between A and C?

---

### 4. Spatial Reasoning (2D / 3D)  
*Directional and Positional Relations*

- **Function**: Trains spatial working memory and mental manipulation of layouts.
- **RFT Frames**: Spatial relational frames (e.g., above, below, left of, right of).
- **Example**:  
  `A is north of B`  
  `B is east of C`  
  → Where is A relative to C?

---

### 5. Arrangements (Linear / Circular)  
*Ordering and Placement Logic*

- **Function**: Trains reasoning about order, adjacency, and relative position.
- **RFT Frames**: Sequential and hierarchical frames.
- **Example**:  
  Determine the relative positions of items in a line or circle given a set of constraints.

---

### 6. Graph Matching  
*Network Structure and Isomorphism*

- **Function**: Trains recognition of structural equivalence across different presentations.
- **RFT Frames**: Complex relational networks.
- **Example**:  
  Decide whether two node–edge diagrams represent the same underlying structure.

---

### 7. Analogy  
*Relational Mapping*

- **Function**: Trains analogical reasoning and transfer of patterns across domains.
- **RFT Frames**: Higher-order relational frames (relations between relations).
- **Example**:  
  `A : B :: C : ?`  
  Infer the item that stands to C as B stands to A.

---

### 8. Binary Logic  
*Boolean Operations and Compound Conditions*

- **Function**: Trains reasoning with logical operators and compound statements.
- **RFT Frames**: Boolean relational operations.
- **Example**:  
  Evaluate truth values under combinations of `AND`, `OR`, `XOR`, `NAND`, etc.

---

## Adaptive Learning

### Performance-Based Difficulty

- **Premise Scaling**: The number of premises in a question adjusts dynamically based on recent performance.
- **Tier Progression**: Users advance through difficulty tiers by meeting score thresholds.
- **Training Blocks**: Performance is tracked in blocks; thresholds trigger automatic difficulty adjustments.

---

## Installation and Development

### Prerequisites

- Node.js 16+
- Angular CLI 15+

### Setup

```bash
git clone https://github.com/igweo/sv4.git
cd sv4
npm install
npm start
````

### Production Build

```bash
npm run prep-deploy:prod
```
---

## Acknowledgments

### Original Project

This project is a fork of [Syllogimous-v4](https://github.com/4skinSkywalker/Syllogimous-v4), originally created by [4skinSkywalker](https://github.com/4skinSkywalker). The original project is described as “a revamp of Syllogimous v3”.

* **Original Repository**: [https://github.com/4skinSkywalker/Syllogimous-v4](https://github.com/4skinSkywalker/Syllogimous-v4)
* **Original Author**: [4skinSkywalker](https://github.com/4skinSkywalker)

> **Note**: Refer to the [original repository](https://github.com/4skinSkywalker/Syllogimous-v4) for the original license terms and conditions.


### Current Maintainer

- **Maintainer**: [igweo](https://github.com/igweo)
