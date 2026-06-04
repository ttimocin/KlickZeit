import { useTheme } from '@/context/ThemeContext';
import i18n from '@/i18n';
import { clearGameState, getSudokuBestTimes, getSudokuLevels, loadGameState, saveGameState, saveSudokuBestTime, saveSudokuLevel, SudokuBestTimes, SudokuGameState, SudokuLevelProgress } from '@/services/game-storage';
import { BLANK, Difficulty, generatePuzzle } from '@/services/sudoku';
import { getLeaderboard, LeaderboardEntry, saveBestTimeToFirestore } from '@/services/sudoku-leaderboard';
import { getUserCode } from '@/services/user-code';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import CongratsOverlay from './CongratsOverlay';

interface SudokuGameProps {
    visible: boolean;
    onClose: () => void;
    breakStartTime?: number | null; // timestamp when break started
}

const { width } = Dimensions.get('window');
const CONTAINER_PADDING = 20;
const GRID_SIZE = width - CONTAINER_PADDING * 2;
const CELL_SIZE = Math.floor(GRID_SIZE / 9);

export default function SudokuGame({ visible, onClose, breakStartTime }: SudokuGameProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = createStyles(isDark, CELL_SIZE);

    // Break timer
    const [breakElapsed, setBreakElapsed] = useState<string | null>(null);

    useEffect(() => {
        if (!breakStartTime) {
            setBreakElapsed(null);
            return;
        }
        const tick = () => {
            const elapsed = Date.now() - breakStartTime;
            const h = Math.floor(elapsed / 3600000);
            const m = Math.floor((elapsed % 3600000) / 60000);
            const s = Math.floor((elapsed % 60000) / 1000);
            setBreakElapsed(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [breakStartTime]);

    // State
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [initialBoard, setInitialBoard] = useState<number[][]>([]);
    const [board, setBoard] = useState<number[][]>([]);
    const [solution, setSolution] = useState<number[][]>([]);
    const [notes, setNotes] = useState<{ [key: string]: number[] }>({});
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
    const [mistakes, setMistakes] = useState(0);
    const [timer, setTimer] = useState(0);
    const [isNoteMode, setIsNoteMode] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [gameWon, setGameWon] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Best Times & Levels
    const [bestTimes, setBestTimes] = useState<SudokuBestTimes>({ Easy: 0, Medium: 0, Hard: 0 });
    const [levels, setLevels] = useState<SudokuLevelProgress>({ Easy: 1, Medium: 1, Hard: 1 });
    const [currentLevel, setCurrentLevel] = useState(1);
    const [isNewRecord, setIsNewRecord] = useState(false);

    // User Code & Leaderboard
    const [userCode, setUserCode] = useState('');
    const [leaderboards, setLeaderboards] = useState<{ [key: string]: LeaderboardEntry[] }>({});
    const [showLeaderboard, setShowLeaderboard] = useState<Difficulty | null>(null);
    const [hasSavedGame, setHasSavedGame] = useState(false);
    const [savedState, setSavedState] = useState<any>(null);

    // Initial load
    useEffect(() => {
        if (visible) {
            loadGame();
            loadGameData();
            loadUserCode();
            loadLeaderboards();
        } else {
            if (isPlaying && !gameOver && !gameWon) {
                saveGame();
            }
        }
    }, [visible]);

    const loadUserCode = () => {
        try {
            const code = getUserCode();
            setUserCode(code);
        } catch {
            setUserCode('');
        }
    };

    const loadLeaderboards = async () => {
        try {
            const [easy, medium, hard] = await Promise.all([
                getLeaderboard('Easy', 10),
                getLeaderboard('Medium', 10),
                getLeaderboard('Hard', 10),
            ]);
            setLeaderboards({ Easy: easy, Medium: medium, Hard: hard });
        } catch {
            // Offline — leaderboard boş kalır
        }
    };

    const loadGameData = async () => {
        const times = await getSudokuBestTimes();
        const avLevels = await getSudokuLevels();
        setBestTimes(times);
        setLevels(avLevels);
    };

    // Timer
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isPlaying && !gameOver && !gameWon) {
            interval = setInterval(() => {
                setTimer((t) => t + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, gameOver, gameWon]);

    // Auto save
    useEffect(() => {
        if (isPlaying && !gameOver && !gameWon) {
            const timeout = setTimeout(saveGame, 2000);
            return () => clearTimeout(timeout);
        }
    }, [board, mistakes, timer]);

    const loadGame = async () => {
        setLoading(true);
        const saved = await loadGameState('sudoku');

        if (saved && (saved.grid as SudokuGameState)) {
            const state = saved.grid as SudokuGameState;
            if (!state.gameOver) {
                // Don't auto-start — store the saved state for the user to choose
                setSavedState(state);
                setHasSavedGame(true);
                setLoading(false);
                return;
            }
        }
        setHasSavedGame(false);
        setSavedState(null);
        setLoading(false);
    };

    const resumeGame = async () => {
        if (!savedState) return;
        const avLevels = await getSudokuLevels();
        setInitialBoard(savedState.initialBoard);
        setBoard(savedState.currentBoard);
        setSolution(savedState.solution);
        setNotes(savedState.notes || {});
        setMistakes(savedState.mistakes);
        setTimer(savedState.timer);
        setDifficulty(savedState.difficulty as Difficulty);
        setCurrentLevel(avLevels[savedState.difficulty as keyof SudokuLevelProgress]);
        setIsPlaying(true);
        setHasSavedGame(false);
        setSavedState(null);
    };

    const saveGame = async () => {
        if (!isPlaying || !difficulty || gameOver || gameWon) return;

        const state: SudokuGameState = {
            initialBoard,
            currentBoard: board,
            solution,
            notes,
            mistakes,
            timer,
            difficulty,
            gameOver: false,
        };

        await saveGameState({
            grid: state,
            score: timer,
            gameOver: false,
            won: false
        }, 'sudoku');
    };

    const startNewGame = (diff: Difficulty, levelToPlay?: number) => {
        setLoading(true);
        setIsNewRecord(false);
        const lvl = levelToPlay || levels[diff];

        setTimeout(() => {
            // Seed generation: Difficulty + Level (e.g., "Easy-1")
            const seed = `${diff}-${lvl}`;
            const { initialBoard: init, solution: sol } = generatePuzzle(diff, seed);

            setInitialBoard(init);
            setBoard(init.map(row => [...row]));
            setSolution(sol);
            setNotes({});
            setMistakes(0);
            setTimer(0);
            setDifficulty(diff);
            setCurrentLevel(lvl);
            setGameOver(false);
            setGameWon(false);
            setIsPlaying(true);
            setSelectedCell(null);
            setLoading(false);

            clearGameState('sudoku');
        }, 100);
    };

    const handleNumberInput = (num: number) => {
        if (!selectedCell || gameOver || gameWon) return;
        const { row, col } = selectedCell;

        if (initialBoard[row][col] !== BLANK) return;

        if (isNoteMode) {
            setNotes(prev => {
                const key = `${row}-${col}`;
                const cellNotes = prev[key] || [];
                if (cellNotes.includes(num)) {
                    return { ...prev, [key]: cellNotes.filter(n => n !== num) };
                } else {
                    return { ...prev, [key]: [...cellNotes, num].sort() };
                }
            });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
            if (num === solution[row][col]) {
                const newBoard = [...board];
                newBoard[row] = [...newBoard[row]];
                newBoard[row][col] = num;
                setBoard(newBoard);
                cleanNotes(row, col, num);

                checkWin(newBoard);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } else {
                setMistakes(m => {
                    const newMistakes = m + 1;
                    if (newMistakes >= 3) {
                        setGameOver(true);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        clearGameState('sudoku');
                    } else {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    }
                    return newMistakes;
                });
            }
        }
    };

    const handleErase = () => {
        if (!selectedCell || gameOver || gameWon) return;
        const { row, col } = selectedCell;
        if (initialBoard[row][col] !== BLANK) return;

        const newBoard = [...board];
        newBoard[row] = [...newBoard[row]];
        newBoard[row][col] = BLANK;
        setBoard(newBoard);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const cleanNotes = (row: number, col: number, num: number) => {
        setNotes(prev => {
            const next = { ...prev };
            delete next[`${row}-${col}`];
            for (let i = 0; i < 9; i++) {
                removeNote(next, row, i, num);
                removeNote(next, i, col, num);
            }
            const startRow = Math.floor(row / 3) * 3;
            const startCol = Math.floor(col / 3) * 3;
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    removeNote(next, startRow + i, startCol + j, num);
                }
            }
            return next;
        });
    };

    const removeNote = (notesObj: any, r: number, c: number, n: number) => {
        const key = `${r}-${c}`;
        if (notesObj[key]) {
            notesObj[key] = notesObj[key].filter((x: number) => x !== n);
            if (notesObj[key].length === 0) delete notesObj[key];
        }
    };

    const checkWin = async (currentBoard: number[][]) => {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (currentBoard[i][j] === BLANK) return;
            }
        }

        // WINNER!
        setGameWon(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        clearGameState('sudoku');

        // Update Level & Best Time
        if (difficulty) {
            const nextLevel = currentLevel + 1;
            if (currentLevel === levels[difficulty]) {
                await saveSudokuLevel(difficulty, nextLevel);
                setLevels(prev => ({ ...prev, [difficulty]: nextLevel }));
            }

            const isNew = await saveSudokuBestTime(difficulty, timer);
            if (isNew) {
                setIsNewRecord(true);
                loadGameData();
            }

            // Firestore'a da kaydet
            try {
                await saveBestTimeToFirestore(difficulty, timer);
                loadLeaderboards(); // Leaderboard'u güncelle
            } catch {
                // Offline — yerel kayıt yeterli
            }
        }
    };

    const formatTime = (seconds: number) => {
        if (!seconds && seconds !== 0) return '--:--';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const renderCell = (row: number, col: number) => {
        const value = board[row][col];
        const isInitial = initialBoard[row][col] !== BLANK;
        const isSelected = selectedCell?.row === row && selectedCell?.col === col;
        const isRelated = selectedCell && (selectedCell.row === row || selectedCell.col === col ||
            (Math.floor(selectedCell.row / 3) === Math.floor(row / 3) && Math.floor(selectedCell.col / 3) === Math.floor(col / 3)));
        const isSameNumber = selectedCell && board[selectedCell.row][selectedCell.col] !== BLANK && value === board[selectedCell.row][selectedCell.col];

        const borderRight = (col + 1) % 3 === 0 && col !== 8 ? 2 : 1;
        const borderBottom = (row + 1) % 3 === 0 && row !== 8 ? 2 : 1;
        const borderColor = isDark ? '#444' : '#ccc';
        const thickBorderColor = isDark ? '#666' : '#999';

        return (
            <Pressable
                key={`${row}-${col}`}
                style={[
                    styles.cell,
                    {
                        borderRightWidth: borderRight,
                        borderBottomWidth: borderBottom,
                        borderRightColor: borderRight === 2 ? thickBorderColor : borderColor,
                        borderBottomColor: borderBottom === 2 ? thickBorderColor : borderColor,
                        backgroundColor: isSelected
                            ? (isDark ? '#0ea5e950' : '#bae6fd')
                            : isSameNumber
                                ? (isDark ? '#0ea5e930' : '#e0f2fe')
                                : isRelated
                                    ? (isDark ? '#333' : '#f0f9ff')
                                    : 'transparent'
                    }
                ]}
                onPress={() => {
                    setSelectedCell({ row, col });
                    Haptics.selectionAsync();
                }}
            >
                {value !== BLANK ? (
                    <Text style={[
                        styles.cellText,
                        isInitial && styles.initialText,
                        isSameNumber && styles.highlightText
                    ]}>
                        {value}
                    </Text>
                ) : (
                    <View style={styles.notesContainer}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                            <Text key={n} style={[styles.noteText, { opacity: notes[`${row}-${col}`]?.includes(n) ? 1 : 0 }]}>
                                {n}
                            </Text>
                        ))}
                    </View>
                )}
            </Pressable>
        );
    };

    const handleBack = () => {
        if (showLeaderboard) {
            setShowLeaderboard(null);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else if (isPlaying && !gameOver && !gameWon) {
            // Oyun devam ediyorsa onay iste
            Alert.alert(
                i18n.t('gameOver') || 'Oyun Bitti',
                i18n.t('quitGameConfirm') || 'Oyundan çıkmak istiyor musunuz? İlerlemeniz kaydedilecek.',
                [
                    { text: i18n.t('cancel') || 'İptal', style: 'cancel' },
                    {
                        text: i18n.t('menu') || 'Menü',
                        style: 'destructive',
                        onPress: () => {
                            saveGame();
                            setIsPlaying(false);
                            setGameOver(false);
                            setGameWon(false);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        },
                    },
                ]
            );
        } else if (isPlaying) {
            // Oyun bitti/kazanıldı — direkt çık
            setIsPlaying(false);
            setGameOver(false);
            setGameWon(false);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
            onClose();
        }
    };

    const renderLeaderboardModal = () => {
        if (!showLeaderboard) return null;
        const entries = leaderboards[showLeaderboard] || [];
        const diffColors: Record<string, string> = { Easy: '#22c55e', Medium: '#eab308', Hard: '#ef4444' };

        return (
            <View style={styles.leaderboardOverlay}>
                <View style={styles.leaderboardContainer}>
                    <View style={styles.leaderboardHeader}>
                        <Text style={styles.leaderboardTitle}>
                            🏆 {showLeaderboard} - {i18n.t('topPlayers') || 'En İyi Oyuncular'}
                        </Text>
                    </View>

                    <ScrollView style={styles.leaderboardList}>
                        {entries.length === 0 ? (
                            <Text style={styles.leaderboardEmpty}>
                                {i18n.t('noRecordsYet') || 'Henüz kayıt yok'}
                            </Text>
                        ) : (
                            entries.map((entry, index) => (
                                <View
                                    key={entry.userCode}
                                    style={[
                                        styles.leaderboardRow,
                                        entry.userCode === userCode && styles.leaderboardRowHighlight,
                                    ]}
                                >
                                    <View style={styles.leaderboardRankContainer}>
                                        <Text style={[
                                            styles.leaderboardRank,
                                            index < 3 && { color: diffColors[showLeaderboard] }
                                        ]}>
                                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                                        </Text>
                                    </View>
                                    <View style={styles.leaderboardInfo}>
                                        <Text style={styles.leaderboardName} numberOfLines={1}>
                                            {entry.displayName}
                                        </Text>
                                        <Text style={styles.leaderboardCode}>{entry.userCode}</Text>
                                    </View>
                                    <Text style={styles.leaderboardTime}>{formatTime(entry.bestTime)}</Text>
                                </View>
                            ))
                        )}
                    </ScrollView>

                    <TouchableOpacity
                        style={[styles.leaderboardCloseBtn, { backgroundColor: diffColors[showLeaderboard] }]}
                        onPress={() => { setShowLeaderboard(null); Haptics.selectionAsync(); }}
                    >
                        <Text style={styles.leaderboardCloseBtnText}>{i18n.t('menu') || 'Menü'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderTopEntries = (diff: Difficulty) => {
        const entries = leaderboards[diff] || [];
        if (entries.length === 0) return null;

        return (
            <View style={styles.topEntriesContainer}>
                {entries.slice(0, 3).map((entry, index) => (
                    <Text key={entry.userCode} style={styles.topEntryText} numberOfLines={1}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} {entry.displayName} - {formatTime(entry.bestTime)}
                    </Text>
                ))}
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={handleBack}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Sudoku</Text>
                    <View style={styles.headerRight} />
                </View>

                {!isPlaying && !showLeaderboard ? (
                    // Menu Screen
                    <ScrollView contentContainerStyle={styles.menuContainer}>
                        <Text style={styles.menuTitle}>{i18n.t('selectDifficulty') || 'Zorluk Seç'}</Text>

                        {/* Continue button if there's a saved game */}
                        {hasSavedGame && savedState && (
                            <TouchableOpacity
                                style={[styles.menuButton, { backgroundColor: '#0ea5e9', marginBottom: 8 }]}
                                onPress={resumeGame}
                            >
                                <View>
                                    <Text style={styles.menuButtonText}>▶ {i18n.t('continue') || 'Devam Et'}</Text>
                                    <Text style={styles.subText}>{savedState.difficulty} - {i18n.t('level') || 'Seviye'}.{savedState.level || ''} | {formatTime(savedState.timer)}</Text>
                                </View>
                            </TouchableOpacity>
                        )}

                        {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(diff => (
                            <View key={diff} style={styles.difficultySection}>
                                <TouchableOpacity
                                    style={[styles.menuButton, styles[`btn${diff}` as keyof typeof styles] as any]}
                                    onPress={() => startNewGame(diff)}
                                >
                                    <View>
                                        <Text style={styles.menuButtonText}>{diff}</Text>
                                        <Text style={styles.subText}>
                                            Level {levels[diff]}
                                        </Text>
                                        <Text style={styles.bestTimeText}>
                                            {i18n.t('bestTime') || 'En İyi'}: {formatTime(bestTimes[diff as keyof SudokuBestTimes])}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                {/* Top 3 mini-leaderboard */}
                                {renderTopEntries(diff)}
                                <TouchableOpacity
                                    style={styles.viewLeaderboardBtn}
                                    onPress={() => { setShowLeaderboard(diff); Haptics.selectionAsync(); }}
                                >
                                    <Ionicons name="trophy-outline" size={14} color={isDark ? '#aaa' : '#666'} />
                                    <Text style={styles.viewLeaderboardText}>
                                        {i18n.t('leaderboard') || 'Puan Tablosu'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                        {loading && <ActivityIndicator style={{ marginTop: 20 }} size="large" color={isDark ? '#fff' : '#000'} />}
                        {loading && <Text style={[styles.subText, { textAlign: 'center' }]}>{i18n.t('loading') || 'Yükleniyor...'}</Text>}
                    </ScrollView>
                ) : showLeaderboard ? (
                    renderLeaderboardModal()
                ) : (
                    // Game Screen
                    <View style={styles.gameContainer}>
                        <View style={styles.infoBar}>
                            <Text style={styles.infoText}>{difficulty} - {i18n.t('level') || 'Seviye'} {currentLevel}</Text>
                            <Text style={styles.infoText}>{formatTime(timer)}</Text>
                            <Text style={[styles.infoText, { color: mistakes >= 3 ? '#ef4444' : (isDark ? '#fff' : '#000') }]}>
                                {i18n.t('mistakes') || 'Hatalar'}: {mistakes}/3
                            </Text>
                        </View>

                        <View style={styles.gridContainer}>
                            {board.map((row, r) => (
                                <View key={r} style={styles.row}>
                                    {row.map((_, c) => renderCell(r, c))}
                                </View>
                            ))}
                        </View>

                        <View style={styles.controls}>
                            <TouchableOpacity
                                style={[styles.controlButton, isNoteMode && styles.activeControl]}
                                onPress={() => { setIsNoteMode(!isNoteMode); Haptics.selectionAsync(); }}
                            >
                                <Ionicons name="pencil" size={24} color={isNoteMode ? '#fff' : (isDark ? '#ccc' : '#666')} />
                                <Text style={[styles.controlText, isNoteMode && { color: '#fff' }]}>{i18n.t('notes') || 'Not'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.controlButton} onPress={handleErase}>
                                <Ionicons name="backspace" size={24} color={isDark ? '#ccc' : '#666'} />
                                <Text style={styles.controlText}>{i18n.t('erase') || 'Sil'}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.numpad}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <TouchableOpacity
                                    key={num}
                                    style={styles.numButton}
                                    onPress={() => handleNumberInput(num)}
                                >
                                    <Text style={styles.numText}>{num}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Break Timer */}
                        {breakElapsed && (
                            <View style={styles.breakTimerBar}>
                                <Ionicons name="cafe" size={16} color={isDark ? '#f59e0b' : '#d97706'} />
                                <Text style={styles.breakTimerLabel}>{i18n.t('breakTime') || 'Mola'}</Text>
                                <Text style={styles.breakTimerValue}>{breakElapsed}</Text>
                            </View>
                        )}

                        {(gameOver || gameWon) && (
                            <View style={styles.overlay}>
                                {gameWon && (
                                    <CongratsOverlay
                                        visible={gameWon}
                                        score={timer}
                                        isNewRecord={isNewRecord}
                                        isDark={isDark}
                                    />
                                )}
                                <Text style={styles.overlayTitle}>
                                    {gameWon ? (i18n.t('youWon') || 'Kazandın!') : (i18n.t('gameOver') || 'Oyun Bitti')}
                                </Text>

                                {gameWon && isNewRecord && (
                                    <View style={styles.newRecordBadge}>
                                        <Text style={styles.newRecordText}>{i18n.t('newRecord') || 'YENİ REKOR!'}</Text>
                                    </View>
                                )}

                                <Text style={styles.overlayText}>{i18n.t('time') || 'Süre'}: {formatTime(timer)}</Text>

                                {/* User Code in overlay */}
                                {userCode ? (
                                    <Text style={styles.overlayUserCode}>{userCode}</Text>
                                ) : null}

                                {gameWon && difficulty && (
                                    <TouchableOpacity style={styles.newGameButton} onPress={() => startNewGame(difficulty, currentLevel + 1)}>
                                        <Text style={styles.newGameButtonText}>{i18n.t('nextLevel') || 'Sıradaki Seviye'}</Text>
                                    </TouchableOpacity>
                                )}

                                {(!gameWon) && (
                                    <TouchableOpacity style={styles.newGameButton} onPress={() => startNewGame(difficulty!, currentLevel)}>
                                        <Text style={styles.newGameButtonText}>{i18n.t('restart') || 'Tekrar Dene'}</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity style={[styles.secondaryButton, { marginTop: 15 }]} onPress={handleBack}>
                                    <Text style={styles.secondaryButtonText}>{i18n.t('menu') || 'Menü'}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </View>
        </Modal>
    );
}

const createStyles = (isDark: boolean, cellSize: number) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: isDark ? '#1a1a1a' : '#fff',
        paddingTop: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    backButton: {
        padding: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: isDark ? '#fff' : '#000',
    },
    headerRight: {
        width: 34,
    },
    menuContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
        gap: 15,
    },
    menuTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: isDark ? '#fff' : '#000',
        marginBottom: 10,
    },
    // User Code Badge
    userCodeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? '#1e3a5f' : '#eff6ff',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        marginBottom: 10,
    },
    userCodeText: {
        fontSize: 14,
        fontWeight: '700',
        color: isDark ? '#0ea5e9' : '#2563eb',
        letterSpacing: 1,
    },
    guestLabel: {
        fontSize: 12,
        color: isDark ? '#888' : '#999',
    },
    // Difficulty section
    difficultySection: {
        alignItems: 'center',
        width: 260,
    },
    menuButton: {
        width: 220,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    btnEasy: { backgroundColor: '#22c55e' },
    btnMedium: { backgroundColor: '#eab308' },
    btnHard: { backgroundColor: '#ef4444' },
    menuButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    subText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        marginTop: 2,
    },
    bestTimeText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        marginTop: 2,
        fontWeight: '500',
    },
    // Top entries (mini leaderboard under each button)
    topEntriesContainer: {
        marginTop: 6,
        width: '100%',
        paddingHorizontal: 10,
    },
    topEntryText: {
        fontSize: 11,
        color: isDark ? '#aaa' : '#777',
        lineHeight: 18,
    },
    viewLeaderboardBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
        paddingVertical: 4,
    },
    viewLeaderboardText: {
        fontSize: 12,
        color: isDark ? '#aaa' : '#666',
        textDecorationLine: 'underline',
    },
    // Game
    gameContainer: {
        flex: 1,
        alignItems: 'center',
    },
    infoBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '90%',
        marginBottom: 15,
    },
    infoText: {
        color: isDark ? '#ccc' : '#666',
        fontWeight: '600',
    },
    gridContainer: {
        borderWidth: 2,
        borderColor: isDark ? '#666' : '#000',
        backgroundColor: isDark ? '#000' : '#fff',
    },
    row: {
        flexDirection: 'row',
    },
    cell: {
        width: cellSize,
        height: cellSize,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: isDark ? '#333' : '#eee',
    },
    cellText: {
        fontSize: cellSize * 0.6,
        color: isDark ? '#3b82f6' : '#2563eb',
        fontWeight: '500',
    },
    initialText: {
        color: isDark ? '#fff' : '#000',
        fontWeight: 'bold',
    },
    highlightText: {
        fontWeight: 'bold',
    },
    notesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: '100%',
        height: '100%',
        padding: 1,
    },
    noteText: {
        fontSize: cellSize * 0.25,
        width: '33%',
        textAlign: 'center',
        color: isDark ? '#888' : '#666',
    },
    controls: {
        flexDirection: 'row',
        gap: 40,
        marginTop: 20,
        marginBottom: 20,
    },
    controlButton: {
        alignItems: 'center',
        padding: 10,
        borderRadius: 8,
    },
    activeControl: {
        backgroundColor: '#3b82f6',
    },
    controlText: {
        marginTop: 5,
        fontSize: 12,
        color: isDark ? '#ccc' : '#666',
    },
    numpad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 15,
        maxWidth: 350,
    },
    numButton: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: isDark ? '#333' : '#f0f0f0',
        borderRadius: 25,
    },
    numText: {
        fontSize: 20,
        color: isDark ? '#fff' : '#000',
        fontWeight: '500',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    overlayTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    overlayText: {
        fontSize: 20,
        color: '#ccc',
        marginBottom: 10,
    },
    overlayUserCode: {
        fontSize: 14,
        color: '#0ea5e9',
        marginBottom: 20,
        letterSpacing: 1,
        fontWeight: '600',
    },
    newRecordBadge: {
        backgroundColor: '#eab308',
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 15,
        marginBottom: 20,
    },
    newRecordText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 14,
    },
    newGameButton: {
        paddingHorizontal: 30,
        paddingVertical: 15,
        backgroundColor: '#3b82f6',
        borderRadius: 25,
    },
    newGameButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    secondaryButton: {
        paddingHorizontal: 30,
        paddingVertical: 10,
    },
    secondaryButtonText: {
        fontSize: 16,
        color: '#ccc',
    },
    // Leaderboard
    leaderboardOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    leaderboardContainer: {
        width: '100%',
        maxHeight: '80%',
        backgroundColor: isDark ? '#222' : '#fff',
        borderRadius: 16,
        padding: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    leaderboardHeader: {
        alignItems: 'center',
        marginBottom: 15,
    },
    leaderboardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: isDark ? '#fff' : '#000',
    },
    leaderboardList: {
        maxHeight: 400,
    },
    leaderboardEmpty: {
        textAlign: 'center',
        color: isDark ? '#888' : '#999',
        fontSize: 14,
        paddingVertical: 20,
    },
    leaderboardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? '#333' : '#eee',
    },
    leaderboardRowHighlight: {
        backgroundColor: isDark ? '#1e3a5f' : '#eff6ff',
        borderRadius: 8,
    },
    leaderboardRankContainer: {
        width: 35,
        alignItems: 'center',
    },
    leaderboardRank: {
        fontSize: 16,
        fontWeight: 'bold',
        color: isDark ? '#ccc' : '#666',
    },
    leaderboardInfo: {
        flex: 1,
        marginLeft: 10,
    },
    leaderboardName: {
        fontSize: 14,
        fontWeight: '600',
        color: isDark ? '#fff' : '#000',
    },
    leaderboardCode: {
        fontSize: 11,
        color: isDark ? '#888' : '#999',
        marginTop: 1,
    },
    leaderboardTime: {
        fontSize: 16,
        fontWeight: 'bold',
        color: isDark ? '#0ea5e9' : '#2563eb',
        marginLeft: 10,
    },
    leaderboardCloseBtn: {
        marginTop: 15,
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
    },
    leaderboardCloseBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // Break Timer
    breakTimerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 15,
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(217, 119, 6, 0.1)',
        borderRadius: 20,
    },
    breakTimerLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: isDark ? '#f59e0b' : '#d97706',
    },
    breakTimerValue: {
        fontSize: 14,
        fontWeight: '700',
        color: isDark ? '#fbbf24' : '#b45309',
        fontVariant: ['tabular-nums'] as any,
        letterSpacing: 1,
    },
});
