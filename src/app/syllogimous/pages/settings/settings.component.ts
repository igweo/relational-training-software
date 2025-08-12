import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { EnumScreens } from '../../constants/syllogimous.constants';
import { FormControl } from '@angular/forms';
import { DEFAULT_DAILY_GOAL, DEFAULT_PREMISES_DOWN_THRESHOLD, DEFAULT_PREMISES_UP_THRESHOLD, DEFAULT_TRAINING_UNIT_LENGTH, DEFAULT_WEEKLY_GOAL, ProgressAndPerformanceService } from '../../services/progress-and-performance.service';
import { LS_DAILY_GOAL, LS_PREMISES_DOWN_THRESHOLD, LS_PREMISES_UP_THRESHOLD, LS_TRAINING_UNIT_LENGTH, LS_WEEKLY_GOAL } from '../../constants/local-storage.constants';
import { SyllogimousService } from '../../services/syllogimous.service';
import { LS_SPEECH_MODE, LS_VISUAL_MODE, LS_GRAPH_ARRANGEMENT_MODE } from '../../constants/local-storage.constants';
import { EnumQuestionType } from '../../constants/question.constants';
import { areSettingsInvalid, Settings } from '../../models/settings.models';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
    Math = Math;
    EnumScreens = EnumScreens;

    dailyProgressMinutes = new FormControl(DEFAULT_DAILY_GOAL);
    weeklyProgressMinutes = new FormControl(DEFAULT_WEEKLY_GOAL);

    trainingUnitLength = new FormControl(DEFAULT_TRAINING_UNIT_LENGTH);
    premisesUpThreshold = new FormControl(DEFAULT_PREMISES_UP_THRESHOLD);
    premisesDownThreshold = new FormControl(DEFAULT_PREMISES_DOWN_THRESHOLD);

    speechMode = new FormControl(false);
    visualMode = new FormControl(false);
    graphArrangementMode = new FormControl(true);

    constructor(
        public router: Router,
        public sylSrv: SyllogimousService,
        private progressAndPerformanceService: ProgressAndPerformanceService
    ) {
        // Playtime stuff     
        const daily = localStorage.getItem(LS_DAILY_GOAL);
        this.dailyProgressMinutes.setValue(Number(daily) || DEFAULT_DAILY_GOAL);
        this.dailyProgressMinutes.valueChanges
            .subscribe(v => localStorage.setItem(LS_DAILY_GOAL, String(v)));

        const weekly = localStorage.getItem(LS_WEEKLY_GOAL);
        this.weeklyProgressMinutes.setValue(Number(weekly) || DEFAULT_WEEKLY_GOAL);
        this.weeklyProgressMinutes.valueChanges
            .subscribe(v => localStorage.setItem(LS_WEEKLY_GOAL, String(v)));

        // Training unit stuff
        const { trainingUnitLength, premisesUpThreshold, premisesDownThreshold } = this.progressAndPerformanceService.getTrainingUnitSettings();
        
        this.trainingUnitLength.setValue(trainingUnitLength);
        this.trainingUnitLength.valueChanges
            .subscribe(v => localStorage.setItem(LS_TRAINING_UNIT_LENGTH, String(v)));

        this.premisesUpThreshold.setValue(premisesUpThreshold);
        this.premisesUpThreshold.valueChanges
            .subscribe(v => localStorage.setItem(LS_PREMISES_UP_THRESHOLD, String(v)));

        this.premisesDownThreshold.setValue(premisesDownThreshold);
        this.premisesDownThreshold.valueChanges
            .subscribe(v => localStorage.setItem(LS_PREMISES_DOWN_THRESHOLD, String(v)));

        // Speech mode
        const speechModeStored = localStorage.getItem(LS_SPEECH_MODE);
        this.speechMode.setValue(speechModeStored === null ? false : speechModeStored === "true");
        this.speechMode.valueChanges
            .subscribe(v => localStorage.setItem(LS_SPEECH_MODE, String(v)));

        // Visual mode
        const visualModeStored = localStorage.getItem(LS_VISUAL_MODE);
        this.visualMode.setValue(visualModeStored === null ? false : visualModeStored === "true");
        this.visualMode.valueChanges
            .subscribe(v => localStorage.setItem(LS_VISUAL_MODE, String(v)));

        // Graph arrangement mode
        const graphArrangementModeStored = localStorage.getItem(LS_GRAPH_ARRANGEMENT_MODE);
        this.graphArrangementMode.setValue(graphArrangementModeStored === null ? true : graphArrangementModeStored === "true");
        this.graphArrangementMode.valueChanges
            .subscribe(v => localStorage.setItem(LS_GRAPH_ARRANGEMENT_MODE, String(v)));
    }

    getQuestionTypes(): EnumQuestionType[] {
        return Object.values(EnumQuestionType);
    }

    setMatrixReasoningOnly(): void {
        // Create or update playground settings
        if (!this.sylSrv.playgroundSettings) {
            this.sylSrv.playgroundSettings = new Settings(this.sylSrv.settings);
        }
        
        // Disable all question types first
        Object.values(EnumQuestionType).forEach(questionType => {
            this.sylSrv.playgroundSettings!.question[questionType].enabled = false;
        });
        
        // Enable only Matrix Reasoning
        this.sylSrv.playgroundSettings.question[EnumQuestionType.MatrixReasoning].enabled = true;
    }

    toggleQuestionType(questionType: EnumQuestionType, event: Event): void {
        const target = event.target as HTMLInputElement;
        
        // Create or update playground settings
        if (!this.sylSrv.playgroundSettings) {
            this.sylSrv.playgroundSettings = new Settings(this.sylSrv.settings);
        }
        
        this.sylSrv.playgroundSettings.question[questionType].enabled = target.checked;
    }

    getCurrentSettings(): Settings {
        return this.sylSrv.playgroundSettings || this.sylSrv.settings;
    }

    isQuestionTypeEnabled(questionType: EnumQuestionType): boolean {
        try {
            return this.getCurrentSettings().question[questionType]?.enabled || false;
        } catch (error) {
            console.error('Error checking question type enabled status:', error);
            return false;
        }
    }

    getValidationError(): string | null {
        try {
            return areSettingsInvalid(this.getCurrentSettings());
        } catch (error) {
            console.error('Error validating settings:', error);
            return null;
        }
    }

}
