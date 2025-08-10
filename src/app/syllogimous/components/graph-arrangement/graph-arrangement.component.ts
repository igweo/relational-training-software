import { Component, EventEmitter, Input, OnInit, AfterViewInit, Output, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Question } from '../../models/question.models';
import { EnumQuestionType } from '../../constants/question.constants';

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  directed: boolean;
}

export interface GraphArrangementData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

@Component({
  selector: 'app-graph-arrangement',
  templateUrl: './graph-arrangement.component.html',
  styleUrls: ['./graph-arrangement.component.css']
})
export class GraphArrangementComponent implements AfterViewInit {
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  @Input() question!: Question;
  @Input() userAnswer?: boolean;
  @Output() arrangementComplete = new EventEmitter<boolean>();
  @Output() arrangementData = new EventEmitter<GraphArrangementData>();

  nodes: GraphNode[] = [];
  edges: GraphEdge[] = [];
  expectedNodes: string[] = [];
  expectedEdges: GraphEdge[] = [];
  
  private ctx!: CanvasRenderingContext2D;
  private isDragging = false;
  private dragNode: GraphNode | null = null;
  private isDrawingEdge = false;
  private edgeStartNode: GraphNode | null = null;
  private mouseX = 0;
  private mouseY = 0;
  
  // Connection mode state
  connectionMode = false;
  selectedNodeForConnection: GraphNode | null = null;
  
  // Canvas dimensions - will be set dynamically
  canvasWidth = 800;
  canvasHeight = 600;
  readonly nodeRadius = 30;
  
  // Bound event handlers for proper cleanup
  private boundMouseDown!: (e: MouseEvent) => void;
  private boundMouseMove!: (e: MouseEvent) => void;
  private boundMouseUp!: (e: MouseEvent) => void;
  private boundContextMenu!: (e: MouseEvent) => void;
  private boundTouchStart!: (e: TouchEvent) => void;
  private boundTouchMove!: (e: TouchEvent) => void;
  private boundTouchEnd!: (e: TouchEvent) => void;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    // Use multiple attempts to get proper dimensions from dynamically created element
    this.waitForContainerAndSetup();
    
    // Add resize listener for true responsiveness
    this.addResizeListener();
  }

  ngOnDestroy() {
    // Clean up resize listener
    this.removeResizeListener();
  }

  private addResizeListener() {
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('orientationchange', this.onOrientationChange);
  }

  private removeResizeListener() {
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('orientationchange', this.onOrientationChange);
  }

  private onWindowResize = () => {
    // Debounce resize events
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      this.handleResize();
    }, 100);
  };

  private onOrientationChange = () => {
    // Handle orientation changes on mobile
    setTimeout(() => {
      this.handleResize();
    }, 200);
  };

  private resizeTimeout: any;

  private handleResize() {
    console.log('Handling resize/orientation change');
    this.setupCanvas();
    this.initializeNodes(); // Reposition nodes for new canvas size
    this.render();
  }

  private waitForContainerAndSetup(attempts: number = 0) {
    const canvas = this.canvas.nativeElement;
    const container = canvas.parentElement!;
    const rect = container.getBoundingClientRect();
    
    console.log(`Attempt ${attempts + 1}: Canvas container rect:`, rect);
    
    // If container still has no dimensions and we haven't tried too many times
    if ((rect.width === 0 || rect.height === 0) && attempts < 10) {
      setTimeout(() => this.waitForContainerAndSetup(attempts + 1), 50);
      return;
    }
    
    this.setupCanvas();
    this.extractExpectedGraph();
    this.initializeNodes();
    this.render();
  }

  private setupCanvas() {
    const canvas = this.canvas.nativeElement;
    const container = canvas.parentElement!;
    
    // Clear canvas to ensure proper context setup
    canvas.width = 1;
    canvas.height = 1;
    
    // Get container and viewport information
    const rect = container.getBoundingClientRect();
    const isModal = container.closest('.modal-dialog') !== null;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    console.log('Canvas setup - Container rect:', rect);
    console.log(`Device: mobile=${isMobile}, tablet=${isTablet}, modal=${isModal}`);
    
    // Calculate available space
    let availableWidth = rect.width || container.clientWidth;
    let availableHeight = rect.height || container.clientHeight;
    
    // Fallback if container dimensions not available
    if (availableWidth < 100) {
      availableWidth = isModal ? 
        Math.min(window.innerWidth - 60, 800) : 
        Math.min(window.innerWidth * 0.9, 800);
    }
    if (availableHeight < 100) {
      availableHeight = isModal ?
        Math.min(window.innerHeight * 0.4, 400) :
        Math.min(window.innerHeight * 0.4, 500);
    }
    
    // Calculate canvas dimensions based on device type
    if (isMobile) {
      // Mobile: prioritize fitting width, reasonable height
      this.canvasWidth = Math.min(availableWidth - 16, window.innerWidth - 32);
      this.canvasHeight = Math.min(this.canvasWidth * 0.6, window.innerHeight * 0.3, 280);
      
      // Ensure minimum viable mobile size
      this.canvasWidth = Math.max(this.canvasWidth, 280);
      this.canvasHeight = Math.max(this.canvasHeight, 200);
    } else if (isTablet) {
      // Tablet: balanced approach
      this.canvasWidth = Math.min(availableWidth - 24, 600);
      this.canvasHeight = Math.min(this.canvasWidth * 0.7, 420);
      
      // Ensure minimum tablet size
      this.canvasWidth = Math.max(this.canvasWidth, 400);
      this.canvasHeight = Math.max(this.canvasHeight, 280);
    } else {
      // Desktop: optimal size with maximum limits
      this.canvasWidth = Math.min(availableWidth - 40, 800);
      this.canvasHeight = Math.min(availableHeight - 40, 500);
      
      // Ensure minimum desktop size
      this.canvasWidth = Math.max(this.canvasWidth, 500);
      this.canvasHeight = Math.max(this.canvasHeight, 350);
    }
    
    console.log(`Setting canvas size: ${this.canvasWidth}x${this.canvasHeight}`);
    
    // Set up high-DPI canvas rendering
    const displayWidth = this.canvasWidth;
    const displayHeight = this.canvasHeight;
    const actualWidth = displayWidth * devicePixelRatio;
    const actualHeight = displayHeight * devicePixelRatio;
    
    // Set the actual canvas resolution
    canvas.width = actualWidth;
    canvas.height = actualHeight;
    
    // Set the display size via CSS - this makes it responsive
    if (isMobile) {
      // On mobile, let CSS control width for full responsiveness
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      canvas.style.maxWidth = displayWidth + 'px';
      canvas.style.maxHeight = displayHeight + 'px';
    } else {
      // On desktop/tablet, use fixed dimensions
      canvas.style.width = displayWidth + 'px';
      canvas.style.height = displayHeight + 'px';
    }
    
    // Update our internal dimensions
    this.canvasWidth = displayWidth;
    this.canvasHeight = displayHeight;
    
    // Firefox-specific: Get context with better error handling
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d', { 
        alpha: false, // Better performance in Firefox
        desynchronized: false // Better compatibility
      });
      
      if (!ctx) {
        // Fallback for older Firefox versions
        ctx = canvas.getContext('2d');
      }
    } catch (error) {
      console.error('Error getting canvas context:', error);
    }
    
    if (!ctx) {
      console.error('Failed to get 2D context from canvas - browser may not support HTML5 Canvas');
      // Show fallback message
      canvas.style.display = 'none';
      const fallbackDiv = document.createElement('div');
      fallbackDiv.innerHTML = '<div class="alert alert-warning text-center" style="margin: 20px;"><strong>Canvas Not Supported</strong><br>Your browser does not support the HTML5 Canvas element required for the graph. Please try updating your browser or use Chrome, Firefox, or Safari.</div>';
      container.appendChild(fallbackDiv);
      return;
    }
    
    this.ctx = ctx;
    
    // Scale the context for high-DPI displays
    if (devicePixelRatio > 1) {
      this.ctx.scale(devicePixelRatio, devicePixelRatio);
    }
    
    // Firefox-specific: Set better canvas properties
    this.ctx.imageSmoothingEnabled = true;
    if ('imageSmoothingQuality' in this.ctx) {
      (this.ctx as any).imageSmoothingQuality = 'high';
    }
    
    // Draw a visible background to confirm canvas is working
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Add a border inside the canvas to make it more visible
    this.ctx.strokeStyle = '#dee2e6';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(1, 1, this.canvasWidth - 2, this.canvasHeight - 2);
    
    console.log('Canvas setup complete');
    
    // Remove existing event listeners to avoid duplicates
    canvas.removeEventListener('mousedown', this.boundMouseDown);
    canvas.removeEventListener('mousemove', this.boundMouseMove);
    canvas.removeEventListener('mouseup', this.boundMouseUp);
    canvas.removeEventListener('contextmenu', this.boundContextMenu);
    canvas.removeEventListener('touchstart', this.boundTouchStart);
    canvas.removeEventListener('touchmove', this.boundTouchMove);
    canvas.removeEventListener('touchend', this.boundTouchEnd);
    
    // Create bound methods for better event handling
    this.boundMouseDown = (e) => this.onMouseDown(e);
    this.boundMouseMove = (e) => this.onMouseMove(e);
    this.boundMouseUp = (e) => this.onMouseUp(e);
    this.boundContextMenu = (e) => {
      e.preventDefault();
      this.onRightClick(e);
    };
    this.boundTouchStart = (e) => this.onTouchStart(e);
    this.boundTouchMove = (e) => this.onTouchMove(e);
    this.boundTouchEnd = (e) => this.onTouchEnd(e);
    
    // Add event listeners with better Firefox compatibility
    canvas.addEventListener('mousedown', this.boundMouseDown, { passive: false });
    canvas.addEventListener('mousemove', this.boundMouseMove, { passive: false });
    canvas.addEventListener('mouseup', this.boundMouseUp, { passive: false });
    canvas.addEventListener('contextmenu', this.boundContextMenu, { passive: false });
    
    // Add touch support for mobile
    if (isMobile || 'ontouchstart' in window) {
      canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false });
      canvas.addEventListener('touchmove', this.boundTouchMove, { passive: false });
      canvas.addEventListener('touchend', this.boundTouchEnd, { passive: false });
    }
  }

  private extractExpectedGraph() {
    // Extract the objects and relationships from the question
    this.expectedNodes = this.getQuestionObjects();
    this.expectedEdges = this.getExpectedRelationships();
  }

  private extractObjectsFromText(text: string): string[] {
    const objects: string[] = [];
    
    // First try to extract from HTML tags
    const matches = text.match(/<span class="subject">(.*?)<\/span>/g);
    if (matches) {
      matches.forEach(match => {
        const obj = match.replace(/<span class="subject">|<\/span>/g, '');
        objects.push(obj);
      });
    } else {
      // Fallback: extract capitalized words from plain text
      const capitalizedWords = text.match(/\b[A-Z][\w-]*\b/g);
      if (capitalizedWords) {
        capitalizedWords.forEach(word => {
          // Filter out common words that shouldn't be objects
          if (!['A', 'An', 'The', 'Is', 'Are', 'Was', 'Were', 'All', 'Some', 'No', 'Not'].includes(word)) {
            objects.push(word);
          }
        });
      }
    }
    
    return objects;
  }

  private getQuestionObjects(): string[] {
    const objects = new Set<string>();
    
    // Extract objects from premises
    this.question.premises.forEach(premise => {
      const premiseObjects = this.extractObjectsFromText(premise);
      premiseObjects.forEach(obj => objects.add(obj));
    });

    // Extract objects from conclusion
    const conclusionStr = Array.isArray(this.question.conclusion) 
      ? this.question.conclusion.join(' ') 
      : this.question.conclusion;
    
    const conclusionObjects = this.extractObjectsFromText(conclusionStr);
    conclusionObjects.forEach(obj => objects.add(obj));

    const result = Array.from(objects);
    console.log('Extracted objects from question:', result);
    
    // Add test data if no objects found
    if (result.length === 0) {
      console.log('No objects found, adding test data');
      return ['NodeA', 'NodeB', 'NodeC'];
    }

    return result;
  }

  private getExpectedRelationships(): GraphEdge[] {
    const edges: GraphEdge[] = [];
    
    switch (this.question.type) {
      case EnumQuestionType.ComparisonNumerical:
      case EnumQuestionType.ComparisonChronological:
        edges.push(...this.getComparisonEdges());
        break;
      case EnumQuestionType.Distinction:
        edges.push(...this.getDistinctionEdges());
        break;
      case EnumQuestionType.Direction:
      case EnumQuestionType.Direction3DSpatial:
      case EnumQuestionType.Direction3DTemporal:
        edges.push(...this.getDirectionEdges());
        break;
      case EnumQuestionType.LinearArrangement:
      case EnumQuestionType.CircularArrangement:
        edges.push(...this.getArrangementEdges());
        break;
      case EnumQuestionType.GraphMatching:
        edges.push(...this.getGraphMatchingEdges());
        break;
      case EnumQuestionType.Syllogism:
        edges.push(...this.getSyllogismEdges());
        break;
      default:
        // For other question types, infer from premises
        edges.push(...this.inferEdgesFromPremises());
        break;
    }

    return edges;
  }

  private getComparisonEdges(): GraphEdge[] {
    const edges: GraphEdge[] = [];
    
    // For comparison questions, create directed edges based on the ordering
    // Parse premises to determine relationships
    this.question.premises.forEach(premise => {
      const objects = this.extractObjectsFromText(premise);
      if (objects.length >= 2) {
        const [obj1, obj2] = objects;
        
        // Determine direction based on relationship words
        const isGreaterOrAfter = premise.includes('greater') || premise.includes('larger') || 
                               premise.includes('higher') || premise.includes('after') || 
                               premise.includes('later') || premise.includes('superior');
        
        if (isGreaterOrAfter) {
          edges.push({ from: obj1, to: obj2, directed: true });
        } else {
          edges.push({ from: obj2, to: obj1, directed: true });
        }
      }
    });

    return edges;
  }

  private getDistinctionEdges(): GraphEdge[] {
    const edges: GraphEdge[] = [];
    
    console.log('Getting distinction edges for question:', this.question);
    console.log('Question buckets:', this.question.buckets);
    console.log('Expected nodes:', this.expectedNodes);
    
    // For distinction questions, group similar objects
    // Objects in the same group should have bidirectional edges
    if (this.question.buckets && this.question.buckets.length >= 2) {
      console.log('Processing buckets:', this.question.buckets);
      
      this.question.buckets.forEach((bucket, bucketIndex) => {
        console.log(`Processing bucket ${bucketIndex}:`, bucket);
        
        if (bucket.length > 1) {
          // Connect all objects in the same bucket with bidirectional edges
          for (let i = 0; i < bucket.length; i++) {
            for (let j = i + 1; j < bucket.length; j++) {
              const edge = { from: bucket[i], to: bucket[j], directed: false };
              console.log('Creating distinction edge:', edge);
              edges.push(edge);
            }
          }
        }
      });
    } else {
      console.log('No valid buckets found for distinction question');
      
      // Fallback: try to infer groupings from premises if buckets are not available
      const groupedItems = this.inferDistinctionGroupsFromPremises();
      console.log('Inferred groups:', groupedItems);
      
      Object.values(groupedItems).forEach((group: string[]) => {
        if (group.length > 1) {
          for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
              edges.push({ from: group[i], to: group[j], directed: false });
            }
          }
        }
      });
    }

    console.log('Final distinction edges:', edges);
    return edges;
  }

  private inferDistinctionGroupsFromPremises(): Record<string, string[]> {
    const groups: Record<string, string[]> = {};
    
    // Analyze premises to group objects that are described as similar/same
    this.question.premises.forEach(premise => {
      const objects = this.extractObjectsFromText(premise);
      
      if (objects.length >= 2) {
        // Check if the premise indicates similarity/sameness
        const isSimilarityPremise = premise.includes('same') || premise.includes('identical') || 
                                   premise.includes('equivalent') || premise.includes('similar') ||
                                   !premise.includes('different') && !premise.includes('distinct');
        
        if (isSimilarityPremise) {
          // Group these objects together
          const groupKey = objects.sort().join(',');
          if (!groups[groupKey]) {
            groups[groupKey] = [];
          }
          objects.forEach(obj => {
            if (!groups[groupKey].includes(obj)) {
              groups[groupKey].push(obj);
            }
          });
        }
      }
    });
    
    // If no clear groups found, create individual groups
    if (Object.keys(groups).length === 0) {
      this.expectedNodes.forEach((node, index) => {
        groups[`group_${index}`] = [node];
      });
    }
    
    return groups;
  }

  private getDirectionEdges(): GraphEdge[] {
    const edges: GraphEdge[] = [];
    
    // For direction questions, create edges based on spatial relationships
    this.question.premises.forEach(premise => {
      const objects = this.extractObjectsFromText(premise);
      if (objects.length >= 2) {
        const [obj1, obj2] = objects;
        
        // Direction edges are typically directional
        edges.push({ from: obj1, to: obj2, directed: true });
      }
    });

    return edges;
  }

  private getArrangementEdges(): GraphEdge[] {
    const edges: GraphEdge[] = [];
    
    // For arrangement questions, create edges based on positional relationships
    this.question.premises.forEach(premise => {
      const objects = this.extractObjectsFromText(premise);
      if (objects.length >= 2) {
        const [obj1, obj2] = objects;
        edges.push({ from: obj1, to: obj2, directed: true });
      }
    });

    return edges;
  }

  private getGraphMatchingEdges(): GraphEdge[] {
    const edges: GraphEdge[] = [];
    
    // Use existing graph data if available
    if (this.question.graphPremises && this.question.graphPremises.length > 0) {
      this.question.graphPremises.forEach(([from, rel, to]) => {
        const directed = rel === "→" || rel === "←";
        const actualFrom = rel === "←" ? to : from;
        const actualTo = rel === "←" ? from : to;
        
        edges.push({ from: actualFrom, to: actualTo, directed });
      });
    }

    return edges;
  }

  private getSyllogismEdges(): GraphEdge[] {
    const edges: GraphEdge[] = [];
    
    // For syllogisms, create edges based on logical relationships
    // This is more complex and would require parsing the syllogistic structure
    this.question.premises.forEach(premise => {
      const objects = this.extractObjectsFromText(premise);
      if (objects.length >= 2) {
        const [obj1, obj2] = objects;
        
        // Determine if it's a positive or negative relationship
        const isPositive = !premise.includes('not') && !premise.includes('No ');
        
        if (isPositive) {
          edges.push({ from: obj1, to: obj2, directed: true });
        }
      }
    });

    return edges;
  }

  private inferEdgesFromPremises(): GraphEdge[] {
    const edges: GraphEdge[] = [];
    
    // Generic inference from premises
    this.question.premises.forEach(premise => {
      const objects = this.extractObjectsFromText(premise);
      if (objects.length >= 2) {
        const [obj1, obj2] = objects;
        edges.push({ from: obj1, to: obj2, directed: true });
      }
    });

    return edges;
  }

  private initializeNodes() {
    console.log('Initializing nodes with expected nodes:', this.expectedNodes);
    this.nodes = []; // Clear existing nodes
    
    // Create nodes for expected objects, positioned in a circle
    this.expectedNodes.forEach((obj, index) => {
      const angle = (2 * Math.PI * index) / this.expectedNodes.length;
      const centerX = this.canvasWidth / 2;
      const centerY = this.canvasHeight / 2;
      const radius = Math.min(centerX, centerY) * 0.6;
      
      const node = {
        id: obj,
        label: obj,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
      
      this.nodes.push(node);
      console.log(`Created node: ${obj} at (${node.x.toFixed(1)}, ${node.y.toFixed(1)})`);
    });
    
    console.log(`Total nodes created: ${this.nodes.length}`);
  }

  private onMouseDown(e: MouseEvent) {
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const node = this.getNodeAt(x, y);
    
    if (e.button === 0) { // Left click
      if (node) {
        if (this.connectionMode) {
          // Handle connection mode clicks
          this.handleConnectionModeClick(node);
        } else {
          // Regular drag mode
          this.isDragging = true;
          this.dragNode = node;
        }
      }
    }
  }

  private handleConnectionModeClick(node: GraphNode) {
    if (!this.selectedNodeForConnection) {
      // First click: select the node
      this.selectedNodeForConnection = node;
      this.render(); // Re-render to show selection
    } else if (this.selectedNodeForConnection === node) {
      // Click same node: deselect
      this.selectedNodeForConnection = null;
      this.render();
    } else {
      // Second click: create connection
      this.createConnection(this.selectedNodeForConnection, node);
      this.selectedNodeForConnection = null;
      this.render();
    }
  }

  private createConnection(fromNode: GraphNode, toNode: GraphNode) {
    // Check if edge already exists
    const existingEdge = this.edges.find(edge => 
      edge.from === fromNode.id && edge.to === toNode.id
    );
    
    if (!existingEdge) {
      this.edges.push({
        from: fromNode.id,
        to: toNode.id,
        directed: true
      });
      this.checkArrangement();
    }
  }

  toggleConnectionMode() {
    this.connectionMode = !this.connectionMode;
    this.selectedNodeForConnection = null; // Clear selection when toggling
    this.render();
  }

  toggleEdgeDirection() {
    // Toggle between directed and undirected edges for the last created edge
    if (this.edges.length > 0) {
      const lastEdge = this.edges[this.edges.length - 1];
      lastEdge.directed = !lastEdge.directed;
      this.render();
      this.checkArrangement();
    }
  }

  private onMouseMove(e: MouseEvent) {
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
    
    if (this.isDragging && this.dragNode) {
      this.dragNode.x = this.mouseX;
      this.dragNode.y = this.mouseY;
      this.render();
    }
    
    if (this.isDrawingEdge) {
      this.render();
    }
  }

  private onMouseUp(e: MouseEvent) {
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (this.isDrawingEdge && this.edgeStartNode) {
      const endNode = this.getNodeAt(x, y);
      if (endNode && endNode !== this.edgeStartNode) {
        // Check if edge already exists
        const existingEdge = this.edges.find(edge => 
          edge.from === this.edgeStartNode!.id && edge.to === endNode.id
        );
        
        if (!existingEdge) {
          this.edges.push({
            from: this.edgeStartNode.id,
            to: endNode.id,
            directed: true
          });
        }
      }
      
      this.isDrawingEdge = false;
      this.edgeStartNode = null;
    }
    
    this.isDragging = false;
    this.dragNode = null;
    
    this.render();
    this.checkArrangement();
  }

  private onRightClick(e: MouseEvent) {
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Right-click to remove edge
    const edge = this.getEdgeAt(x, y);
    if (edge) {
      const index = this.edges.indexOf(edge);
      if (index > -1) {
        this.edges.splice(index, 1);
        this.render();
        this.checkArrangement();
      }
    }
  }

  private onTouchStart(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = this.canvas.nativeElement.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      const node = this.getNodeAt(x, y);
      if (node) {
        this.isDragging = true;
        this.dragNode = node;
      }
    }
  }

  private onTouchMove(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length === 1 && this.isDragging && this.dragNode) {
      const touch = e.touches[0];
      const rect = this.canvas.nativeElement.getBoundingClientRect();
      this.dragNode.x = touch.clientX - rect.left;
      this.dragNode.y = touch.clientY - rect.top;
      this.render();
    }
  }

  private onTouchEnd(e: TouchEvent) {
    e.preventDefault();
    this.isDragging = false;
    this.dragNode = null;
    this.checkArrangement();
  }

  private getNodeAt(x: number, y: number): GraphNode | null {
    return this.nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) <= this.nodeRadius;
    }) || null;
  }

  private getEdgeAt(x: number, y: number): GraphEdge | null {
    const tolerance = 10;
    
    return this.edges.find(edge => {
      const fromNode = this.nodes.find(n => n.id === edge.from)!;
      const toNode = this.nodes.find(n => n.id === edge.to)!;
      
      // Check if point is close to the line segment
      const A = x - fromNode.x;
      const B = y - fromNode.y;
      const C = toNode.x - fromNode.x;
      const D = toNode.y - fromNode.y;

      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      const param = lenSq !== 0 ? dot / lenSq : -1;

      let closestX, closestY;
      if (param < 0) {
        closestX = fromNode.x;
        closestY = fromNode.y;
      } else if (param > 1) {
        closestX = toNode.x;
        closestY = toNode.y;
      } else {
        closestX = fromNode.x + param * C;
        closestY = fromNode.y + param * D;
      }

      const dx = x - closestX;
      const dy = y - closestY;
      return Math.sqrt(dx * dx + dy * dy) <= tolerance;
    }) || null;
  }

  private render() {
    if (!this.ctx) {
      console.error('Cannot render: no canvas context available');
      return;
    }
    
    console.log(`Rendering ${this.nodes.length} nodes and ${this.edges.length} edges`);
    
    // Clear canvas completely
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Set white background
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Add subtle border for visibility
    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Draw edges first (behind nodes)
    this.edges.forEach(edge => this.drawEdge(edge));
    
    // Draw temporary edge while drawing
    if (this.isDrawingEdge && this.edgeStartNode) {
      this.drawTemporaryEdge(this.edgeStartNode, this.mouseX, this.mouseY);
    }
    
    // Draw nodes on top with enhanced visibility
    this.nodes.forEach(node => this.drawNode(node));
    
    console.log(`Render complete: drew ${this.nodes.length} nodes`);
    
    // Trigger change detection to update the template
    this.cdr.detectChanges();
  }

  private drawNode(node: GraphNode) {
    console.log(`Drawing node: ${node.label} at (${node.x}, ${node.y})`);
    
    // Ensure we have a valid context
    if (!this.ctx) {
      console.error('No canvas context available for drawing');
      return;
    }
    
    // Save context state
    this.ctx.save();
    
    try {
      const isSelected = this.selectedNodeForConnection === node;
      
      // Draw node circle with better visibility
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, this.nodeRadius, 0, 2 * Math.PI);
      this.ctx.fillStyle = isSelected ? '#ffeb3b' : '#e3f2fd'; // Yellow for selected, blue for normal
      this.ctx.fill();
      
      // Draw border with selection highlighting
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, this.nodeRadius, 0, 2 * Math.PI);
      this.ctx.strokeStyle = isSelected ? '#ff9800' : '#1976d2'; // Orange for selected, blue for normal
      this.ctx.lineWidth = isSelected ? 4 : 2; // Thicker border for selected
      this.ctx.stroke();
      
      // Add pulsing effect for selected node
      if (isSelected) {
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, this.nodeRadius + 8, 0, 2 * Math.PI);
        this.ctx.strokeStyle = 'rgba(255, 152, 0, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }
      
      // Draw node label with better contrast
      this.ctx.fillStyle = '#000000';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      // Wrap text if too long
      const maxWidth = this.nodeRadius * 1.8;
      const text = node.label;
      
      if (this.ctx.measureText(text).width > maxWidth) {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        
        words.forEach(word => {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          if (this.ctx.measureText(testLine).width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });
        lines.push(currentLine);
        
        // Draw multiple lines
        lines.forEach((line, index) => {
          const lineHeight = 14;
          const startY = node.y - ((lines.length - 1) * lineHeight) / 2;
          this.ctx.fillText(line, node.x, startY + index * lineHeight);
        });
      } else {
        this.ctx.fillText(text, node.x, node.y);
      }
      
      console.log(`Successfully drew node: ${node.label}`);
    } catch (error) {
      console.error(`Error drawing node ${node.label}:`, error);
    } finally {
      // Restore context state
      this.ctx.restore();
    }
  }

  private drawEdge(edge: GraphEdge) {
    const fromNode = this.nodes.find(n => n.id === edge.from)!;
    const toNode = this.nodes.find(n => n.id === edge.to)!;
    
    if (!fromNode || !toNode) return;
    
    // Calculate edge endpoints (on node circumference)
    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    const unitX = dx / length;
    const unitY = dy / length;
    
    const startX = fromNode.x + unitX * this.nodeRadius;
    const startY = fromNode.y + unitY * this.nodeRadius;
    const endX = toNode.x - unitX * this.nodeRadius;
    const endY = toNode.y - unitY * this.nodeRadius;
    
    // Draw edge line with color based on question type and direction
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    
    // For distinction questions, use red edges regardless of direction
    // For other questions, use red for directed and green for undirected
    if (this.question.type === EnumQuestionType.Distinction) {
      this.ctx.strokeStyle = '#f44336'; // Red for distinction questions
    } else {
      this.ctx.strokeStyle = edge.directed ? '#f44336' : '#4caf50'; // Red for directed, green for undirected
    }
    
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // Draw arrow if directed
    if (edge.directed) {
      this.drawArrow(endX, endY, Math.atan2(dy, dx));
    }
  }

  private drawTemporaryEdge(fromNode: GraphNode, toX: number, toY: number) {
    this.ctx.beginPath();
    this.ctx.moveTo(fromNode.x, fromNode.y);
    this.ctx.lineTo(toX, toY);
    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  private drawArrow(x: number, y: number, angle: number) {
    const arrowLength = 15;
    const arrowAngle = Math.PI / 6;
    
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(
      x - arrowLength * Math.cos(angle - arrowAngle),
      y - arrowLength * Math.sin(angle - arrowAngle)
    );
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(
      x - arrowLength * Math.cos(angle + arrowAngle),
      y - arrowLength * Math.sin(angle + arrowAngle)
    );
    this.ctx.stroke();
  }

  private checkArrangement() {
    const isCorrect = this.validateArrangement();
    this.arrangementComplete.emit(isCorrect);
    this.arrangementData.emit({ nodes: this.nodes, edges: this.edges });
  }

  validateArrangement(): boolean {
    // Check if all expected nodes are present
    if (this.nodes.length !== this.expectedNodes.length) {
      return false;
    }
    
    // Check if all expected edges are present (with some flexibility)
    return this.validateGraphStructure();
  }

  private validateGraphStructure(): boolean {
    // For now, implement a basic validation
    // This could be enhanced to check for graph isomorphism
    
    if (this.expectedEdges.length === 0) {
      // If no expected edges, any arrangement is valid
      return true;
    }
    
    // Check if the number of edges is reasonable
    const expectedEdgeCount = this.expectedEdges.length;
    const actualEdgeCount = this.edges.length;
    
    // Allow some flexibility in edge count
    if (Math.abs(expectedEdgeCount - actualEdgeCount) > 2) {
      return false;
    }
    
    // For more sophisticated validation, we could:
    // 1. Check if the graphs are isomorphic
    // 2. Validate specific relationship patterns
    // 3. Check transitivity and other logical properties
    
    return true; // Basic validation for now
  }

  resetGraph() {
    this.edges = [];
    this.initializeNodes();
    this.render();
    this.checkArrangement();
  }

  addRandomEdges() {
    // Helper method to add some random valid edges for testing
    if (this.nodes.length >= 2) {
      for (let i = 0; i < Math.min(3, this.expectedEdges.length); i++) {
        const fromNode = this.nodes[Math.floor(Math.random() * this.nodes.length)];
        const toNode = this.nodes[Math.floor(Math.random() * this.nodes.length)];
        
        if (fromNode !== toNode) {
          const existingEdge = this.edges.find(edge => 
            edge.from === fromNode.id && edge.to === toNode.id
          );
          
          if (!existingEdge) {
            this.edges.push({
              from: fromNode.id,
              to: toNode.id,
              directed: true
            });
          }
        }
      }
      this.render();
      this.checkArrangement();
    }
  }
}
