import AsyncStorage from '@react-native-async-storage/async-storage';

export const GAME2048_STATE_KEY = '@game2048_state';
export const GAME2048_HIGH_SCORE_KEY = '@game2048_highscore';
export const SNAKE_STATE_KEY = '@snake_game_state';
export const SNAKE_HIGH_SCORE_KEY = '@snake_game_highscore';
export const TETRIS_HIGH_SCORE_KEY = '@tetris_game_highscore';
export const SUDOKU_STATE_KEY = '@sudoku_game_state';
export const SUDOKU_BEST_TIMES_KEY = '@sudoku_best_times'; // { Easy: number, Medium: number, Hard: number }
export const SUDOKU_LEVEL_KEY = '@sudoku_level_progress'; // { Easy: number, Medium: number, Hard: number }

// Sudoku Level Progress
export interface SudokuLevelProgress {
    Easy: number;
    Medium: number;
    Hard: number;
}

// Sudoku Best Times
export interface SudokuBestTimes {
    Easy: number;
    Medium: number;
    Hard: number;
}

// Sudoku Game State
export interface SudokuGameState {
    initialBoard: number[][];
    currentBoard: number[][];
    solution: number[][];
    notes: { [key: string]: number[] };
    mistakes: number;
    timer: number;
    difficulty: string;
    gameOver: boolean;
}

export interface GameState {
    grid: number[][] | any[] | SudokuGameState; // Generic
    score: number;
    gameOver: boolean;
    won: boolean;
}

type GameType = '2048' | 'snake' | 'sudoku' | 'tetris';

// Generic Save Game
export const saveGameState = async (state: GameState, gameType: GameType) => {
    try {
        let key = GAME2048_STATE_KEY;
        if (gameType === 'snake') key = SNAKE_STATE_KEY;
        if (gameType === 'sudoku') key = SUDOKU_STATE_KEY;

        const jsonValue = JSON.stringify(state);
        await AsyncStorage.setItem(key, jsonValue);
    } catch (e) {
        // saving error
    }
};

// Generic Load Game
export const loadGameState = async (gameType: GameType): Promise<GameState | null> => {
    try {
        let key = GAME2048_STATE_KEY;
        if (gameType === 'snake') key = SNAKE_STATE_KEY;
        if (gameType === 'sudoku') key = SUDOKU_STATE_KEY;

        const jsonValue = await AsyncStorage.getItem(key);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
        return null; // error reading value
    }
};

export const clearGameState = async (gameType: GameType) => {
    try {
        let key = GAME2048_STATE_KEY;
        if (gameType === 'snake') key = SNAKE_STATE_KEY;
        if (gameType === 'sudoku') key = SUDOKU_STATE_KEY;

        await AsyncStorage.removeItem(key);
    } catch (e) {
        // remove error
    }
};

// High Score (2048 & Snake)
export const saveHighScore = async (score: number, gameType: GameType) => {
    try {
        let key = GAME2048_HIGH_SCORE_KEY;
        if (gameType === 'snake') key = SNAKE_HIGH_SCORE_KEY;
        if (gameType === 'tetris') key = TETRIS_HIGH_SCORE_KEY;

        const currentHighScore = await getHighScore(gameType);
        if (score > currentHighScore) {
            await AsyncStorage.setItem(key, score.toString());
        }
    } catch (e) {
        // saving error
    }
};

export const getHighScore = async (gameType: GameType): Promise<number> => {
    try {
        let key = GAME2048_HIGH_SCORE_KEY;
        if (gameType === 'snake') key = SNAKE_HIGH_SCORE_KEY;
        if (gameType === 'tetris') key = TETRIS_HIGH_SCORE_KEY;

        const value = await AsyncStorage.getItem(key);
        if (value !== null) {
            return parseInt(value);
        }
        return 0;
    } catch (e) {
        return 0;
    }
};

// Sudoku Best Times
export const getSudokuBestTimes = async (): Promise<SudokuBestTimes> => {
    try {
        const jsonValue = await AsyncStorage.getItem(SUDOKU_BEST_TIMES_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : { Easy: 0, Medium: 0, Hard: 0 };
    } catch (e) {
        return { Easy: 0, Medium: 0, Hard: 0 };
    }
};

export const saveSudokuBestTime = async (difficulty: string, time: number): Promise<boolean> => {
    try {
        const currentTimes = await getSudokuBestTimes();
        const key = difficulty as keyof SudokuBestTimes;

        // Eğer süre 0 ise (hiç kayıt yoksa) veya yeni süre daha iyiyse (daha azsa) kaydet
        if (currentTimes[key] === 0 || time < currentTimes[key]) {
            const newTimes = { ...currentTimes, [key]: time };
            await AsyncStorage.setItem(SUDOKU_BEST_TIMES_KEY, JSON.stringify(newTimes));
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
};

// Sudoku Levels
export const getSudokuLevels = async (): Promise<SudokuLevelProgress> => {
    try {
        const jsonValue = await AsyncStorage.getItem(SUDOKU_LEVEL_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : { Easy: 1, Medium: 1, Hard: 1 };
    } catch (e) {
        return { Easy: 1, Medium: 1, Hard: 1 };
    }
};

export const saveSudokuLevel = async (difficulty: string, level: number) => {
    try {
        const currentLevels = await getSudokuLevels();
        const key = difficulty as keyof SudokuLevelProgress;

        // Sadece daha yüksek bir seviyeye geçildiyse kaydet
        if (level > currentLevels[key]) {
            const newLevels = { ...currentLevels, [key]: level };
            await AsyncStorage.setItem(SUDOKU_LEVEL_KEY, JSON.stringify(newLevels));
        }
    } catch (e) {
        // Error saving
    }
};
