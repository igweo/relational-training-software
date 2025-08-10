import { Component } from '@angular/core';
import { SyllogimousService } from '../../services/syllogimous.service';
import { StatsService } from '../../services/stats.service';
import { LS_GAME_MODE, LS_TIMER } from '../../constants/local-storage.constants';
import { LS_CUSTOM_TIMERS_KEY } from '../settings/modal-timer-settings/modal-timer-settings.component';
import { Router } from '@angular/router';
import { EnumScreens } from '../../constants/syllogimous.constants';
import { GameTimerService } from '../../services/game-timer.service';
import { SpeechService } from '../../services/speech.service';
import { VisualService } from '../../services/visual.service';
import { LS_SPEECH_MODE, LS_VISUAL_MODE } from '../../constants/local-storage.constants';
import { AnalyticsService } from '../../../shared/services/analytics.service';

@Component({
    selector: 'app-game',
    templateUrl: './game.component.html',
    styleUrls: ['./game.component.css']
})
export class GameComponent {
    Array = Array;

    timerType;
    gameMode;
    timerTimeSeconds = 0;
    trueButtonToTheRight = false;
    selectedOption: string | null = null;
    
    // Graph arrangement state
    showGraphModal = false;
    userAnswer: boolean | undefined = undefined;
    graphArrangementComplete = false;
    graphArrangementData: any = null;

    constructor(
        public sylSrv: SyllogimousService,
        public gameTimerService: GameTimerService,
        private statsService: StatsService,
        private router: Router,
        private speechService: SpeechService,
        private visualService: VisualService,
        private analyticsService: AnalyticsService
    ) {
        this.timerType = localStorage.getItem(LS_TIMER) || '0';
        this.gameMode = localStorage.getItem(LS_GAME_MODE) || '0';
        this.trueButtonToTheRight = Math.random() > 0.5;

        if (this.sylSrv.question.conclusion === "!") {
            this.router.navigate([EnumScreens.Start]);
        }

        // Track game start
        this.analyticsService.trackGameEvent('question_started', {
            question_type: this.sylSrv.question.type,
            timer_type: this.timerType,
            game_mode: this.gameMode,
            has_visual_mode: localStorage.getItem(LS_VISUAL_MODE) === "true",
            has_speech_mode: localStorage.getItem(LS_SPEECH_MODE) === "true"
        });
    }

    ngOnInit() {
        let questionPremises = this.sylSrv.question.premises;
        let conclusion = this.sylSrv.question.conclusion;
        const conclusionFormatted = Array.isArray(conclusion) ? conclusion : [conclusion];
        
        // Check if visual mode is enabled and transform content
        const visualModeEnabled = localStorage.getItem(LS_VISUAL_MODE) === "true";
        if (visualModeEnabled) {
            // Transform premises to visual symbols
            questionPremises = questionPremises.map(premise => 
                this.visualService.transformToVisual(premise)
            );
            
            // Transform conclusion(s) to visual symbols
            if (Array.isArray(conclusion)) {
                conclusion = conclusion.map(c => this.visualService.transformToVisual(c));
            } else {
                conclusion = this.visualService.transformToVisual(conclusion);
            }
            
            // Update the service with transformed content
            this.sylSrv.question.premises = questionPremises;
            this.sylSrv.question.conclusion = conclusion;
            
            // Transform instructions and notes if they exist
            if (this.sylSrv.question.instructions) {
                this.sylSrv.question.instructions = this.sylSrv.question.instructions.map(instruction =>
                    this.visualService.transformToVisual(instruction)
                );
            }
            
            if (this.sylSrv.question.notes) {
                this.sylSrv.question.notes = this.sylSrv.question.notes.map(note =>
                    this.visualService.transformToVisual(note)
                );
            }
        }
        
        // Check if speech mode is enabled before using text-to-speech
        const speechModeEnabled = localStorage.getItem(LS_SPEECH_MODE) === "true";
        if (speechModeEnabled) {
            // Add voicelines to speech queue
            this.speechService.extractWordsWithNegation(
                questionPremises
                    .concat(["Conclusion"])
                    .concat(conclusionFormatted)
                    .concat(["True or false?"])
            ).forEach(
                (voiceLine: string) => {
                    this.speechService.speak(voiceLine)
                })
        }
        switch (this.timerType) {
            case '1': {
                console.log("Custom timer");

                const customTimers = JSON.parse(localStorage.getItem(LS_CUSTOM_TIMERS_KEY) || "{}");
                this.timerTimeSeconds = customTimers[this.sylSrv.question.type] || 90;
                this.kickTimer();

                break;
            }
            case '2': {
                console.log("Adaptive timer");

                const correctRate = 0.5;
                const incorrectRate = 1;
                const timeoutRate = 1.5;
                const newLevelBonus = 15;
                const negationBonus = 3;
                const metaRelationBonus = 4;
                this.timerTimeSeconds = 90;

                const questionType = this.sylSrv.question.type;
                const questionPremisesCount = this.sylSrv.question.premises.length;
                const { typeBasedStats } = this.statsService.calcStats(this.timerType);
                const tbs = typeBasedStats[questionType];

                if (tbs?.stats) {
                    const prevStats = (tbs.stats as any)[questionPremisesCount - 1];
                    const currStats = (tbs.stats as any)[questionPremisesCount];

                    let avgTimeToRespond = this.timerTimeSeconds;
                    if (currStats && currStats.count > 2) {
                        avgTimeToRespond = (currStats.last10Sum / 1000) / (currStats.last10Count || 1);
                        avgTimeToRespond -= correctRate * currStats.last10Correct;
                        avgTimeToRespond += incorrectRate * currStats.last10Incorrect;
                        avgTimeToRespond += timeoutRate * currStats.last10Timeout;
                    } else if (prevStats && prevStats.count > 2) {
                        avgTimeToRespond = (prevStats.last10Sum / 1000) / (prevStats.last10Count || 1);
                        avgTimeToRespond -= correctRate * prevStats.last10Correct;
                        avgTimeToRespond += incorrectRate * prevStats.last10Incorrect;
                        avgTimeToRespond += timeoutRate * prevStats.last10Timeout;
                        avgTimeToRespond += newLevelBonus; // Bonus for the new level
                    }

                    avgTimeToRespond += negationBonus * this.sylSrv.question.negations;
                    avgTimeToRespond += metaRelationBonus * this.sylSrv.question.metaRelations;

                    this.timerTimeSeconds = Math.floor(Math.max(0, avgTimeToRespond));
                }

                this.kickTimer();

                break;
            }
            default: {
                console.log("No timer");
            }
        }
    }

    ngOnDestroy() {
        this.gameTimerService.stop();
    }

    selectOption(option: string) {
        this.selectedOption = option;
    }

    handleAnswer(answer: boolean) {
        this.userAnswer = answer;
        this.gameTimerService.stop();
        
        // Track answer selection
        this.analyticsService.trackInteraction('answer_button', 'click', {
            answer: answer,
            question_type: this.sylSrv.question.type
        });
        
        // For graph arrangement questions, show the graph modal
        if (this.shouldShowGraphArrangement()) {
            this.showGraphModal = true;
        } else {
            // For regular questions, process the answer immediately
            this.sylSrv.checkQuestion(answer);
        }
    }

    submitAnswer() {
        // For Matrix Reasoning questions, check if the selected option is correct
        if (this.sylSrv.question.type === 'Matrix Reasoning' && this.selectedOption) {
            const isCorrect = this.selectedOption === this.sylSrv.question.correctAnswer;
            this.sylSrv.checkQuestion(isCorrect);
        }
        this.gameTimerService.stop();
    }

    onGraphArrangementComplete(isComplete: boolean) {
        this.graphArrangementComplete = isComplete;
    }

    onGraphArrangementData(data: any) {
        this.graphArrangementData = data;
    }

    submitGraphArrangement() {
        // Validate the graph arrangement and provide feedback
        const isGraphCorrect = this.validateGraphArrangement();
        
        // Close the graph modal
        this.showGraphModal = false;
        
        // Combine the original True/False answer with graph correctness
        // For now, we'll use the original answer, but you could modify this logic
        const finalAnswer = this.userAnswer && isGraphCorrect;
        
        this.sylSrv.checkQuestion(finalAnswer);
    }

    closeGraphModal() {
        this.showGraphModal = false;
        // Process the original answer without graph validation
        if (this.userAnswer !== undefined) {
            this.sylSrv.checkQuestion(this.userAnswer);
        }
    }

    private validateGraphArrangement(): boolean {
        if (!this.graphArrangementData) {
            return false;
        }

        const { nodes, edges } = this.graphArrangementData;
        
        // Basic validation - ensure minimum interaction
        if (!nodes || nodes.length === 0) {
            return false;
        }

        // Must have at least one edge
        if (!edges || edges.length === 0) {
            return false;
        }

        // Get expected relationships from question analysis
        const expectedRelationships = this.analyzeQuestionRelationships();
        
        // Validate the user's graph against expected relationships
        return this.validateGraphStructure(edges, expectedRelationships);
    }

    private analyzeQuestionRelationships(): { from: string, to: string, type: 'similar' | 'different' | 'directed' }[] {
        const relationships: { from: string, to: string, type: 'similar' | 'different' | 'directed' }[] = [];
        const questionType = this.sylSrv.question.type;

        // Extract objects from premises
        const objects = this.getQuestionObjects();
        
        switch (questionType) {
            case 'Distinction':
                // For distinction questions, analyze premise relationships
                this.sylSrv.question.premises.forEach(premise => {
                    const premiseObjects = this.extractObjectsFromText(premise);
                    if (premiseObjects.length >= 2) {
                        const [obj1, obj2] = premiseObjects;
                        
                        // Analyze relationship type based on keywords
                        if (premise.includes('same as') || premise.includes('on par with') || premise.includes('indistinguishable')) {
                            relationships.push({ from: obj1, to: obj2, type: 'similar' });
                        } else if (premise.includes('opposite') || premise.includes('different') || premise.includes('disproportionate')) {
                            relationships.push({ from: obj1, to: obj2, type: 'different' });
                        } else {
                            relationships.push({ from: obj1, to: obj2, type: 'directed' });
                        }
                    }
                });
                break;

            case 'Comparison Numerical':
            case 'Comparison Chronological':
                // For comparison questions, create directed relationships based on order
                this.sylSrv.question.premises.forEach(premise => {
                    const premiseObjects = this.extractObjectsFromText(premise);
                    if (premiseObjects.length >= 2) {
                        const [obj1, obj2] = premiseObjects;
                        
                        // Determine direction based on comparison words
                        if (premise.includes('greater') || premise.includes('more') || premise.includes('after') || premise.includes('larger')) {
                            relationships.push({ from: obj1, to: obj2, type: 'directed' });
                        } else if (premise.includes('less') || premise.includes('before') || premise.includes('smaller')) {
                            relationships.push({ from: obj2, to: obj1, type: 'directed' });
                        }
                    }
                });
                break;

            case 'Syllogism':
                // For syllogisms, create logical connections
                this.sylSrv.question.premises.forEach(premise => {
                    const premiseObjects = this.extractObjectsFromText(premise);
                    if (premiseObjects.length >= 2) {
                        const [obj1, obj2] = premiseObjects;
                        relationships.push({ from: obj1, to: obj2, type: 'directed' });
                    }
                });
                break;

            default:
                // Generic relationship extraction
                this.sylSrv.question.premises.forEach(premise => {
                    const premiseObjects = this.extractObjectsFromText(premise);
                    if (premiseObjects.length >= 2) {
                        const [obj1, obj2] = premiseObjects;
                        relationships.push({ from: obj1, to: obj2, type: 'directed' });
                    }
                });
                break;
        }

        return relationships;
    }

    private validateGraphStructure(userEdges: any[], expectedRelationships: any[]): boolean {
        console.log('Validating graph structure...');
        console.log('User edges:', userEdges);
        console.log('Expected relationships:', expectedRelationships);

        // If no expected relationships, accept any reasonable graph structure
        if (expectedRelationships.length === 0) {
            return userEdges.length > 0;
        }

        let correctRelationships = 0;
        const totalExpected = expectedRelationships.length;

        expectedRelationships.forEach(expected => {
            // Check for exact match
            const exactMatch = userEdges.find(edge => 
                edge.from === expected.from && 
                edge.to === expected.to &&
                (expected.type !== 'similar' || !edge.directed) // Similar relationships should be undirected
            );

            // Check for reverse match (for undirected relationships)
            const reverseMatch = userEdges.find(edge => 
                edge.from === expected.to && 
                edge.to === expected.from &&
                (expected.type === 'similar' || expected.type === 'different')
            );

            if (exactMatch || reverseMatch) {
                correctRelationships++;
                console.log(`Found correct relationship: ${expected.from} -> ${expected.to} (${expected.type})`);
            } else {
                console.log(`Missing relationship: ${expected.from} -> ${expected.to} (${expected.type})`);
            }
        });

        // Consider graph correct if at least 60% of relationships are captured
        const accuracy = correctRelationships / totalExpected;
        console.log(`Graph accuracy: ${accuracy * 100}% (${correctRelationships}/${totalExpected})`);
        
        return accuracy >= 0.6;
    }

    private getQuestionObjects(): string[] {
        const objects = new Set<string>();
        
        // Extract objects from premises
        this.sylSrv.question.premises.forEach(premise => {
            const premiseObjects = this.extractObjectsFromText(premise);
            premiseObjects.forEach(obj => objects.add(obj));
        });

        // Extract objects from conclusion
        const conclusionStr = Array.isArray(this.sylSrv.question.conclusion) 
            ? this.sylSrv.question.conclusion.join(' ') 
            : this.sylSrv.question.conclusion;
        
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
                    if (!['A', 'An', 'The', 'Is', 'Are', 'Was', 'Were', 'All', 'Some', 'No', 'Not', 'Based', 'For', 'With'].includes(word)) {
                        objects.push(word);
                    }
                });
            }
        }
        
        return objects;
    }

    shouldShowGraphArrangement(): boolean {
        // Show graph arrangement for certain question types
        const graphQuestionTypes = [
            'Distinction',
            'Direction',
            'Direction3D Spatial', 
            'Direction3D Temporal',
            'Linear Arrangement',
            'Circular Arrangement',
            'Graph Matching',
            'Syllogism',
            'Comparison Numerical',
            'Comparison Chronological'
        ];
        
        return graphQuestionTypes.includes(this.sylSrv.question.type);
    }

    kickTimer = async () => {
        await this.gameTimerService.start(this.timerTimeSeconds);
        this.sylSrv.checkQuestion();
    }
}
