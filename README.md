# Syllogimous v4: RFT Trainer

A sophisticated cognitive training platform based on Relational Frame Theory (RFT) designed to enhance logical reasoning, pattern recognition, and relational thinking abilities through evidence-based training protocols.

## Scientific Foundation

### Relational Frame Theory (RFT)

This application is grounded in **Relational Frame Theory**, a behavioral psychological framework that proposes human language and higher-order cognition emerge from our ability to derive arbitrary relations between stimuli. RFT suggests that the fundamental process of human thought involves forming and manipulating relationships between concepts, rather than simply associating individual stimuli.

Key RFT principles implemented:
- **Relational responding**: Training multiple types of stimulus relations
- **Arbitrarily applicable relational responding**: Working with abstract symbolic relationships
- **Transformation of stimulus functions**: How meaning transfers through relational networks
- **Relational complexity**: Progressively increasing cognitive demands

### Cognitive Training Research

The application implements findings from cognitive training research showing that:
- Relational reasoning training can improve fluid intelligence
- Working memory training transfers to untrained tasks when using varied, adaptive protocols
- Pattern recognition abilities can be enhanced through systematic practice
- Multi-modal training (visual, verbal, spatial) produces stronger effects than single-domain training

## Question Types and Cognitive Functions

### 1. **Distinction** 
*Identity and Equivalence Relations*
- **Function**: Trains same/different discriminatio and categorization
- **RFT Frame**: Coordination and distinction frames
- **Example**: "A is the same as B, B is different from C" → "A is ? C"

### 2. **Syllogism**
*Classical Logical Reasoning*
- **Function**: Enhances deductive reasoning and logical validity assessment
- **RFT Frame**: Complex relational networks with quantifiers
- **Example**: "All X are Y, Some Y are Z" → Evaluate conclusion validity

### 3. **Comparison (Numerical/Chronological)**
*Quantitative and Temporal Relations*
- **Function**: Develops magnitude comparison and temporal sequencing
- **RFT Frame**: Comparative frames (more-than/less-than, before/after)
- **Example**: "A > B, B > C" → "A ? C"

### 4. **Spatial Reasoning (2D/3D)**
*Directional and Positional Relations*
- **Function**: Improves spatial working memory and mental rotation
- **RFT Frame**: Spatial relational frames
- **Example**: "A is north of B, B is east of C" → "A ? C"

### 5. **Arrangements (Linear/Circular)**
*Sequential Positioning Logic*
- **Function**: Trains order relations and transitive reasoning
- **RFT Frame**: Sequential and hierarchical frames
- **Example**: Determining relative positions in ordered sequences

### 6. **Graph Matching**
*Network Isomorphism*
- **Function**: Develops structural pattern recognition
- **RFT Frame**: Complex relational networks
- **Example**: Determining if two connection networks are equivalent

### 7. **Analogy**
*Relational Mapping*
- **Function**: Enhances analogical reasoning and pattern transfer
- **RFT Frame**: Higher-order relational frames
- **Example**: "A:B :: C:?" relationship mapping

### 8. **Matrix Reasoning**
*Visual Pattern Completion*
- **Function**: Trains pattern recognition and rule abstraction
- **RFT Frame**: Multiple simultaneous relational frames
- **Example**: 3x3 grids with missing elements following visual rules

### 9. **Binary Logic**
*Complex Logical Operations*
- **Function**: Develops compound logical reasoning
- **RFT Frame**: Boolean relational operations
- **Example**: AND, OR, XOR, NAND operations on logical premises

## Adaptive Learning System

### Performance-Based Difficulty Adjustment
- **Premise Scaling**: Questions dynamically adjust the number of logical premises based on performance
- **Tier Progression**: Score-based advancement through difficulty levels
- **Training Units**: Performance tracked in blocks with automatic adjustment triggers

### Anti-Memorization Features
- **Conclusion Diversification**: Seven different strategies prevent pattern memorization:
  - Endpoint traditional testing
  - Intermediate chain elements
  - Reverse direction relationships
  - Multi-hop skip testing
  - Premise restatement validation
  - Adjacent pair testing
  - Random pair selection

### Representation Modes
- **Abstract Symbols**: Nonsense strings (QAW, TER, etc.)
- **Meaningful Words**: Real nouns from extensive vocabulary
- **Visual Glyphs**: Geometric and symbolic representations
- **Negation Training**: Strategic use of negated relationships

## Technical Implementation

### Core Architecture
- **Frontend**: Angular 15+ with TypeScript
- **State Management**: RxJS reactive patterns
- **Persistence**: LocalStorage for progress tracking
- **Styling**: Bootstrap 5 with custom CSS

### Key Algorithms
- **Syllogistic Validity**: Implements classical logic validity rules
- **Graph Isomorphism**: Custom algorithm for structural equivalence testing
- **Spatial Reasoning**: Coordinate-based relationship calculation
- **Pattern Generation**: Sophisticated randomization with constraint satisfaction

### Performance Tracking
- **Daily/Weekly Goals**: Time-based progress metrics
- **Question Analytics**: Right/wrong/timeout ratios by type
- **Adaptive Thresholds**: Configurable performance criteria for difficulty adjustment

## Research References

### Relational Frame Theory
- **Hayes, S. C., Barnes-Holmes, D., & Roche, B. (2001)**. *Relational Frame Theory: A Post-Skinnerian account of human language and cognition*. Plenum Press.
- **Stewart, I., & McElwee, J. (2009)**. Relational responding and conditional discrimination procedures: An apparent inconsistency and clarification. *The Behavior Analyst*, 32(2), 309-317.

### Cognitive Training Research
- **Jaeggi, S. M., et al. (2008)**. Improving fluid intelligence with training on working memory: a meta-analysis. *Psychonomic Bulletin & Review*, 15(4), 692-712.
- **Au, J., et al. (2015)**. Improving fluid intelligence with training on working memory: a meta-analysis. *Psychonomic Bulletin & Review*, 22(2), 366-377.

### Relational Reasoning
- **Halford, G. S., Baker, R., McCredden, J. E., & Bain, J. D. (2005)**. How many variables can humans process? *Psychological Science*, 16(1), 70-76.
- **Krawczyk, D. C. (2012)**. The cognition and neuroscience of relational reasoning. *Brain Research*, 1428, 13-23.

### Analogical Reasoning
- **Gentner, D., & Smith, L. (2012)**. Analogical reasoning. *Encyclopedia of Human Behavior*, 130-136.
- **Morrison, R. G., et al. (2004)**. A neurocomputational model of analogical reasoning and its breakdown in frontotemporal lobar degeneration. *Journal of Cognitive Neuroscience*, 16(2), 260-271.

### Matrix Reasoning and Pattern Recognition
- **Carpenter, P. A., Just, M. A., & Shell, P. (1990)**. What one intelligence test measures: a theoretical account of the processing in the Raven Progressive Matrices Test. *Psychological Review*, 97(3), 404.
- **Prabhakaran, V., Smith, J. A., Desmond, J. E., Glover, G. H., & Gabrieli, J. D. (1997)**. Neural substrates of fluid reasoning: an fMRI study of neocortical activation during performance of the Raven's Progressive Matrices Test. *Cognitive Psychology*, 33(1), 43-63.

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
```

### Build for Production
```bash
npm run prep-deploy:prod
```

## Contributing

This project implements evidence-based cognitive training protocols. Contributions should maintain scientific rigor and cite relevant research when proposing new training paradigms.

## Acknowledgments

- **Maintainer**: [igweo](https://github.com/igweo)
- **Scientific Foundation**: Based on decades of RFT research by Hayes, Barnes-Holmes, Roche, and colleagues
- **Cognitive Training Research**: Builds upon work in fluid intelligence and working memory training

---

## License

**BSL License (Business Source License)**

Copyright (c) 2024 igweo

Permission is hereby granted to any person obtaining a copy of this software and associated documentation files (the "Software"), to use, copy, modify, and distribute the Software for non-commercial purposes, subject to the following conditions:

**Non-Commercial Use**: The Software may not be used for commercial purposes without explicit written permission from the copyright holder. Commercial use includes, but is not limited to:
- Selling access to the Software or services based on the Software
- Using the Software in a commercial training or educational service
- Incorporating the Software into commercial cognitive assessment tools
- Monetizing content or services derived from the Software

**Research and Educational Use**: The Software may be freely used for:
- Academic research and publication
- Educational purposes in non-commercial settings  
- Personal cognitive training and development
- Open source contributions and improvements

**Attribution**: Any use, modification, or distribution of the Software must include proper attribution to the original authors and this license notice.

**Change Date**: This license will automatically convert to an open-source license (MIT) on January 1, 2027, after which all restrictions on commercial use will be lifted.

**No Warranty**: THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

For commercial licensing inquiries, please contact: [igweo](https://github.com/igweo)

---

*"The limits of my language mean the limits of my world."* - Ludwig Wittgenstein

*This application extends those limits by training the relational foundations of human reasoning.*
