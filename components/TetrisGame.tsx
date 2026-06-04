import { useTheme } from '@/context/ThemeContext';
import i18n from '@/i18n';
import { GameLeaderboardEntry, getGameLeaderboard, getGameUserRank, saveGameScore } from '@/services/game-leaderboard';
import { getHighScore, saveHighScore } from '@/services/game-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    PanResponder,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TetrisGameProps {
    visible: boolean;
    onClose: () => void;
    breakStartTime?: number | null;
}

const { width, height } = Dimensions.get('window');
const COLS = 10;
const ROWS = 20;
// Reserve space for header (~60), infoBar (~60), controls (~120), safeArea (~130) = ~320px
const AVAILABLE_HEIGHT = height - 320;
const CELL_SIZE_FROM_WIDTH = Math.floor((width - 60) / COLS);
const CELL_SIZE_FROM_HEIGHT = Math.floor(AVAILABLE_HEIGHT / ROWS);
const CELL_SIZE = Math.min(CELL_SIZE_FROM_WIDTH, CELL_SIZE_FROM_HEIGHT);
const BOARD_W = CELL_SIZE * COLS;
const BOARD_H = CELL_SIZE * ROWS;

type Grid = (string | null)[][];
type Piece = { shape: number[][]; color: string };
type Position = { x: number; y: number };

const PIECES: Piece[] = [
    { shape: [[1, 1, 1, 1]], color: '#00bcd4' },           // I - Cyan
    { shape: [[1, 1], [1, 1]], color: '#ffc107' },          // O - Yellow
    { shape: [[0, 1, 0], [1, 1, 1]], color: '#9c27b0' },      // T - Purple
    { shape: [[1, 0, 0], [1, 1, 1]], color: '#2196f3' },      // J - Blue
    { shape: [[0, 0, 1], [1, 1, 1]], color: '#ff9800' },      // L - Orange
    { shape: [[0, 1, 1], [1, 1, 0]], color: '#4caf50' },      // S - Green
    { shape: [[1, 1, 0], [0, 1, 1]], color: '#f44336' },      // Z - Red
];

const createEmptyGrid = (): Grid =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(null));

const getRandomPiece = (): Piece => {
    const p = PIECES[Math.floor(Math.random() * PIECES.length)];
    return { shape: p.shape.map(r => [...r]), color: p.color };
};

const rotatePiece = (shape: number[][]): number[][] => {
    const rows = shape.length;
    const cols = shape[0].length;
    const rotated: number[][] = [];
    for (let c = 0; c < cols; c++) {
        const newRow: number[] = [];
        for (let r = rows - 1; r >= 0; r--) {
            newRow.push(shape[r][c]);
        }
        rotated.push(newRow);
    }
    return rotated;
};

export default function TetrisGame({ visible, onClose, breakStartTime }: TetrisGameProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();
    const styles = createStyles(isDark);

    const [grid, setGrid] = useState<Grid>(createEmptyGrid);
    const [currentPiece, setCurrentPiece] = useState<Piece>(getRandomPiece);
    const [nextPiece, setNextPiece] = useState<Piece>(getRandomPiece);
    const [position, setPosition] = useState<Position>({ x: 3, y: 0 });
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [lines, setLines] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isNewRecord, setIsNewRecord] = useState(false);
    const [rank, setRank] = useState<number | null>(null);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [leaderboardData, setLeaderboardData] = useState<GameLeaderboardEntry[]>([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);

    // Break timer
    const [breakElapsed, setBreakElapsed] = useState<string | null>(null);

    // Refs for game loop
    const gridRef = useRef<Grid>(createEmptyGrid());
    const currentPieceRef = useRef<Piece>(getRandomPiece());
    const nextPieceRef = useRef<Piece>(getRandomPiece());
    const positionRef = useRef<Position>({ x: 3, y: 0 });
    const scoreRef = useRef(0);
    const levelRef = useRef(1);
    const linesRef = useRef(0);
    const isPausedRef = useRef(false);
    const isGameOverRef = useRef(false);
    const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (visible) loadHighScore();
    }, [visible]);

    // Break timer
    useEffect(() => {
        if (!breakStartTime) { setBreakElapsed(null); return; }
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

    const loadHighScore = async () => {
        try {
            const val = await getHighScore('tetris');
            setHighScore(val);
        } catch { }
    };

    const checkCollision = useCallback((piece: Piece, pos: Position, g: Grid): boolean => {
        for (let r = 0; r < piece.shape.length; r++) {
            for (let c = 0; c < piece.shape[r].length; c++) {
                if (piece.shape[r][c]) {
                    const newX = pos.x + c;
                    const newY = pos.y + r;
                    if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
                    if (newY >= 0 && g[newY][newX] !== null) return true;
                }
            }
        }
        return false;
    }, []);

    const lockPiece = useCallback(() => {
        const g = gridRef.current.map(r => [...r]);
        const piece = currentPieceRef.current;
        const pos = positionRef.current;

        for (let r = 0; r < piece.shape.length; r++) {
            for (let c = 0; c < piece.shape[r].length; c++) {
                if (piece.shape[r][c]) {
                    const y = pos.y + r;
                    const x = pos.x + c;
                    if (y < 0) {
                        // Game over
                        endGame();
                        return;
                    }
                    g[y][x] = piece.color;
                }
            }
        }

        // Clear complete lines
        let cleared = 0;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (g[r].every(cell => cell !== null)) {
                g.splice(r, 1);
                g.unshift(Array(COLS).fill(null));
                cleared++;
                r++; // recheck same row
            }
        }

        if (cleared > 0) {
            const points = [0, 100, 300, 500, 800][cleared] * levelRef.current;
            scoreRef.current += points;
            linesRef.current += cleared;
            const newLevel = Math.floor(linesRef.current / 10) + 1;
            if (newLevel !== levelRef.current) {
                levelRef.current = newLevel;
                setLevel(newLevel);
                restartLoop(Math.max(100, 500 - (newLevel - 1) * 40));
            }
            setScore(scoreRef.current);
            setLines(linesRef.current);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        gridRef.current = g;
        setGrid(g.map(r => [...r]));

        // Spawn next piece
        const np = nextPieceRef.current;
        const startPos = { x: Math.floor((COLS - np.shape[0].length) / 2), y: 0 };

        if (checkCollision(np, startPos, g)) {
            endGame();
            return;
        }

        currentPieceRef.current = np;
        positionRef.current = startPos;
        setCurrentPiece({ shape: np.shape.map(r => [...r]), color: np.color });
        setPosition(startPos);

        const newNext = getRandomPiece();
        nextPieceRef.current = newNext;
        setNextPiece(newNext);
    }, [checkCollision]);

    const moveDown = useCallback(() => {
        if (isPausedRef.current || isGameOverRef.current) return;

        const newPos = { ...positionRef.current, y: positionRef.current.y + 1 };
        if (checkCollision(currentPieceRef.current, newPos, gridRef.current)) {
            lockPiece();
        } else {
            positionRef.current = newPos;
            setPosition({ ...newPos });
        }
    }, [checkCollision, lockPiece]);

    const moveLeft = () => {
        if (isPausedRef.current || isGameOverRef.current) return;
        const newPos = { ...positionRef.current, x: positionRef.current.x - 1 };
        if (!checkCollision(currentPieceRef.current, newPos, gridRef.current)) {
            positionRef.current = newPos;
            setPosition({ ...newPos });
            Haptics.selectionAsync();
        }
    };

    const moveRight = () => {
        if (isPausedRef.current || isGameOverRef.current) return;
        const newPos = { ...positionRef.current, x: positionRef.current.x + 1 };
        if (!checkCollision(currentPieceRef.current, newPos, gridRef.current)) {
            positionRef.current = newPos;
            setPosition({ ...newPos });
            Haptics.selectionAsync();
        }
    };

    const rotate = () => {
        if (isPausedRef.current || isGameOverRef.current) return;
        const rotated = rotatePiece(currentPieceRef.current.shape);
        const testPiece = { ...currentPieceRef.current, shape: rotated };
        if (!checkCollision(testPiece, positionRef.current, gridRef.current)) {
            currentPieceRef.current = testPiece;
            setCurrentPiece({ ...testPiece });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const hardDrop = () => {
        if (isPausedRef.current || isGameOverRef.current) return;
        let newY = positionRef.current.y;
        while (!checkCollision(currentPieceRef.current, { ...positionRef.current, y: newY + 1 }, gridRef.current)) {
            newY++;
        }
        positionRef.current = { ...positionRef.current, y: newY };
        setPosition({ ...positionRef.current });
        lockPiece();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    };

    const restartLoop = (interval: number) => {
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        gameLoopRef.current = setInterval(() => moveDown(), interval);
    };

    const startGame = () => {
        const emptyGrid = createEmptyGrid();
        const first = getRandomPiece();
        const next = getRandomPiece();
        const startPos = { x: Math.floor((COLS - first.shape[0].length) / 2), y: 0 };

        gridRef.current = emptyGrid;
        currentPieceRef.current = first;
        nextPieceRef.current = next;
        positionRef.current = startPos;
        scoreRef.current = 0;
        levelRef.current = 1;
        linesRef.current = 0;
        isPausedRef.current = false;
        isGameOverRef.current = false;

        setGrid(emptyGrid);
        setCurrentPiece(first);
        setNextPiece(next);
        setPosition(startPos);
        setScore(0);
        setLevel(1);
        setLines(0);
        setIsPlaying(true);
        setIsGameOver(false);
        setIsPaused(false);
        setIsNewRecord(false);
        setRank(null);

        restartLoop(800);
    };

    const endGame = async () => {
        if (gameLoopRef.current) { clearInterval(gameLoopRef.current); gameLoopRef.current = null; }
        isGameOverRef.current = true;
        setIsGameOver(true);
        setIsPlaying(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        const finalScore = scoreRef.current;

        // Eski rekoru kaydetmeden ÖNCE al
        const oldHighScore = await getHighScore('tetris');
        const wasNewRecord = finalScore > 0 && finalScore > oldHighScore;

        await saveHighScore(finalScore, 'tetris');
        const hs = await getHighScore('tetris');
        setHighScore(hs);
        setIsNewRecord(wasNewRecord);

        // Save to Firebase leaderboard
        await saveGameScore('tetris', finalScore);
        const userRank = await getGameUserRank('tetris');
        setRank(userRank);
    };

    const togglePause = () => {
        isPausedRef.current = !isPausedRef.current;
        setIsPaused(!isPaused);
        Haptics.selectionAsync();
    };

    const goToMenu = () => {
        if (gameLoopRef.current) { clearInterval(gameLoopRef.current); gameLoopRef.current = null; }
        setIsPlaying(false);
        setIsGameOver(false);
        setIsNewRecord(false);
        setRank(null);
        isGameOverRef.current = false;
    };

    const handleBack = () => {
        if (isPlaying && !isGameOver) {
            isPausedRef.current = true;
            setIsPaused(true);
            Alert.alert(
                i18n.t('gameOver') || 'Oyun Bitti',
                i18n.t('quitGameConfirm') || 'Oyundan çıkmak istiyor musunuz?',
                [
                    { text: i18n.t('cancel') || 'İptal', style: 'cancel', onPress: () => { isPausedRef.current = false; setIsPaused(false); } },
                    {
                        text: i18n.t('menu') || 'Menü', style: 'destructive', onPress: () => {
                            goToMenu();
                        }
                    },
                ]
            );
        } else {
            if (gameLoopRef.current) { clearInterval(gameLoopRef.current); gameLoopRef.current = null; }
            setIsGameOver(false);
            setIsPlaying(false);
            onClose();
        }
    };

    useEffect(() => {
        return () => { if (gameLoopRef.current) { clearInterval(gameLoopRef.current); gameLoopRef.current = null; } };
    }, []);

    // Ghost piece position
    const getGhostY = (): number => {
        let y = positionRef.current.y;
        while (!checkCollision(currentPieceRef.current, { ...positionRef.current, y: y + 1 }, gridRef.current)) {
            y++;
        }
        return y;
    };

    // Swipe gesture handling
    const SWIPE_THRESHOLD = CELL_SIZE * 0.8; // one cell
    const swipeAccumX = useRef(0);
    const swipeAccumY = useRef(0);
    const gestureStartX = useRef(0);
    const gestureStartY = useRef(0);

    const boardPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                gestureStartX.current = evt.nativeEvent.pageX;
                gestureStartY.current = evt.nativeEvent.pageY;
                swipeAccumX.current = 0;
                swipeAccumY.current = 0;
            },
            onPanResponderMove: (_evt, gestureState) => {
                // Accumulate movement and trigger cell-by-cell
                const dx = gestureState.dx - swipeAccumX.current;
                const dy = gestureState.dy - swipeAccumY.current;

                if (Math.abs(dx) > SWIPE_THRESHOLD) {
                    if (dx > 0) {
                        moveRight();
                    } else {
                        moveLeft();
                    }
                    swipeAccumX.current = gestureState.dx;
                }
                if (dy > SWIPE_THRESHOLD) {
                    moveDown();
                    swipeAccumY.current = gestureState.dy;
                }
            },
            onPanResponderRelease: (_evt, gestureState) => {
                // Tap: minimal movement → rotate
                const totalDist = Math.sqrt(gestureState.dx ** 2 + gestureState.dy ** 2);
                if (totalDist < 10) {
                    rotate();
                }
            },
        })
    ).current;

    const renderBoard = () => {
        const cells: React.JSX.Element[] = [];
        const ghostY = isPlaying && !isGameOver ? getGhostY() : -1;

        // Render grid cells
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const color = grid[r][c];
                if (color) {
                    cells.push(
                        <View key={`${r}-${c}`} style={[styles.cell, { left: c * CELL_SIZE, top: r * CELL_SIZE, backgroundColor: color }]} />
                    );
                }
            }
        }

        // Ghost piece
        if (ghostY >= 0 && ghostY !== position.y) {
            currentPiece.shape.forEach((row, r) => {
                row.forEach((val, c) => {
                    if (val) {
                        const gx = position.x + c;
                        const gy = ghostY + r;
                        if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) {
                            cells.push(
                                <View key={`ghost-${r}-${c}`} style={[styles.cell, styles.ghostCell, { left: gx * CELL_SIZE, top: gy * CELL_SIZE, borderColor: currentPiece.color }]} />
                            );
                        }
                    }
                });
            });
        }

        // Current piece
        if (isPlaying && !isGameOver) {
            currentPiece.shape.forEach((row, r) => {
                row.forEach((val, c) => {
                    if (val) {
                        const px = position.x + c;
                        const py = position.y + r;
                        if (py >= 0 && py < ROWS && px >= 0 && px < COLS) {
                            cells.push(
                                <View key={`piece-${r}-${c}`} style={[styles.cell, { left: px * CELL_SIZE, top: py * CELL_SIZE, backgroundColor: currentPiece.color }]} />
                            );
                        }
                    }
                });
            });
        }

        return cells;
    };

    const renderNextPiece = () => {
        const cells: React.JSX.Element[] = [];
        const previewSize = CELL_SIZE * 0.7;
        nextPiece.shape.forEach((row, r) => {
            row.forEach((val, c) => {
                if (val) {
                    cells.push(
                        <View key={`next-${r}-${c}`} style={{
                            position: 'absolute',
                            left: c * previewSize,
                            top: r * previewSize,
                            width: previewSize - 1,
                            height: previewSize - 1,
                            backgroundColor: nextPiece.color,
                            borderRadius: 2,
                        }} />
                    );
                }
            });
        });
        return (
            <View style={[styles.nextPieceContainer, { width: 4 * previewSize, height: 4 * previewSize }]}>
                {cells}
            </View>
        );
    };

    const openLeaderboard = async () => {
        setShowLeaderboard(true);
        setLeaderboardLoading(true);
        const data = await getGameLeaderboard('tetris', 10);
        setLeaderboardData(data);
        setLeaderboardLoading(false);
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={handleBack}>
            <View style={[styles.container, { paddingBottom: insets.bottom }]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
                    </TouchableOpacity>

                    {breakElapsed ? (
                        <View style={styles.headerBreakContainer}>
                            <Ionicons name="cafe" size={16} color={isDark ? '#f59e0b' : '#d97706'} />
                            <Text style={styles.headerBreakValue}>{breakElapsed}</Text>
                        </View>
                    ) : <View />}

                    {isPlaying && !isGameOver ? (
                        <TouchableOpacity onPress={togglePause} style={styles.backBtn}>
                            <Ionicons name={isPaused ? 'play' : 'pause'} size={24} color={isDark ? '#fff' : '#000'} />
                        </TouchableOpacity>
                    ) : <View style={{ width: 34 }} />}
                </View>

                {!isPlaying && !isGameOver ? (
                    // Main Menu
                    <View style={styles.startScreen}>
                        <Text style={styles.startTitle}>Block</Text>

                        {highScore > 0 && (
                            <Text style={styles.highScoreText}>🏆 {i18n.t('highScore') || 'En Yüksek Skor'}: {highScore}</Text>
                        )}

                        <TouchableOpacity style={styles.startButton} onPress={startGame}>
                            <Ionicons name="play" size={20} color="#fff" />
                            <Text style={styles.startButtonText}>{i18n.t('newGame') || 'Yeni Oyun'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuSecondaryBtn} onPress={openLeaderboard}>
                            <Ionicons name="trophy" size={20} color="#9c27b0" />
                            <Text style={styles.menuSecondaryBtnText}>{i18n.t('leaderboard') || 'Puan Tablosu'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuExitBtn} onPress={onClose}>
                            <Ionicons name="exit-outline" size={20} color={isDark ? '#888' : '#999'} />
                            <Text style={styles.menuExitBtnText}>{i18n.t('exit') || 'Çıkış'}</Text>
                        </TouchableOpacity>



                        {/* Leaderboard overlay */}
                        {showLeaderboard && (
                            <View style={styles.leaderboardOverlay}>
                                <View style={styles.leaderboardCard}>
                                    <View style={styles.leaderboardHeader}>
                                        <Text style={styles.leaderboardTitle}>🏆 {i18n.t('leaderboard') || 'Puan Tablosu'}</Text>
                                        <TouchableOpacity onPress={() => setShowLeaderboard(false)}>
                                            <Ionicons name="close" size={24} color={isDark ? '#fff' : '#000'} />
                                        </TouchableOpacity>
                                    </View>
                                    {leaderboardLoading ? (
                                        <Text style={styles.leaderboardEmpty}>{i18n.t('loading') || 'Yükleniyor...'}</Text>
                                    ) : leaderboardData.length === 0 ? (
                                        <Text style={styles.leaderboardEmpty}>{i18n.t('noRecordsYet') || 'Henüz kayıt yok'}</Text>
                                    ) : (
                                        <ScrollView style={{ maxHeight: 320 }}>
                                            {leaderboardData.map((entry, idx) => (
                                                <View key={entry.userCode} style={styles.leaderboardRow}>
                                                    <Text style={styles.leaderboardRank}>
                                                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                                                    </Text>
                                                    <Text style={styles.leaderboardName} numberOfLines={1}>{entry.displayName}</Text>
                                                    <Text style={styles.leaderboardScore}>{entry.bestScore}</Text>
                                                </View>
                                            ))}
                                        </ScrollView>
                                    )}
                                </View>
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.gameArea}>
                        {/* Info bar */}
                        <View style={styles.infoBar}>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>{i18n.t('score') || 'Skor'}</Text>
                                <Text style={styles.infoValue}>{score}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>{i18n.t('level') || 'Seviye'}</Text>
                                <Text style={styles.infoValue}>{level}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>{i18n.t('lines') || 'Satır'}</Text>
                                <Text style={styles.infoValue}>{lines}</Text>
                            </View>
                            <View style={styles.nextPreview}>
                                <Text style={styles.infoLabel}>{i18n.t('next') || 'Sonraki'}</Text>
                                {renderNextPiece()}
                            </View>
                        </View>

                        {/* Board */}
                        <View style={styles.board} {...boardPanResponder.panHandlers}>
                            {/* Grid lines */}
                            {Array.from({ length: COLS + 1 }).map((_, i) => (
                                <View key={`vl-${i}`} style={[styles.gridLine, { left: i * CELL_SIZE, top: 0, bottom: 0, width: 1 }]} />
                            ))}
                            {Array.from({ length: ROWS + 1 }).map((_, i) => (
                                <View key={`hl-${i}`} style={[styles.gridLine, { top: i * CELL_SIZE, left: 0, right: 0, height: 1 }]} />
                            ))}
                            {renderBoard()}

                            {isPaused && (
                                <View style={styles.pauseOverlay}>
                                    <Ionicons name="pause-circle" size={64} color="rgba(255,255,255,0.8)" />
                                </View>
                            )}
                        </View>

                        {/* Controls */}
                        <View style={[styles.controls, { paddingBottom: insets.bottom + 8 }]}>
                            <View style={styles.controlRow}>
                                <TouchableOpacity style={styles.ctrlBtn} onPress={moveLeft}>
                                    <Ionicons name="chevron-back" size={28} color={isDark ? '#ccc' : '#666'} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.ctrlBtn} onPress={moveDown}>
                                    <Ionicons name="chevron-down" size={28} color={isDark ? '#ccc' : '#666'} />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.ctrlBtn, styles.rotateBtn]} onPress={rotate}>
                                    <Ionicons name="refresh" size={26} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.ctrlBtn} onPress={hardDrop}>
                                    <Ionicons name="chevron-down" size={28} color={isDark ? '#ccc' : '#666'} />
                                    <Ionicons name="chevron-down" size={18} color={isDark ? '#ccc' : '#666'} style={{ marginTop: -12 }} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.ctrlBtn} onPress={moveRight}>
                                    <Ionicons name="chevron-forward" size={28} color={isDark ? '#ccc' : '#666'} />
                                </TouchableOpacity>
                            </View>
                        </View>



                        {/* Game Over */}
                        {isGameOver && (
                            <View style={styles.overlay}>
                                <Text style={styles.overlayTitle}>{i18n.t('gameOver') || 'Oyun Bitti!'}</Text>
                                <Text style={styles.overlayScore}>{i18n.t('score') || 'Skor'}: {score}</Text>
                                <Text style={styles.overlayLines}>{i18n.t('lines') || 'Satır'}: {lines}  |  Lv {level}</Text>
                                {isNewRecord && (
                                    <View style={styles.newRecordBadge}>
                                        <Text style={styles.newRecordText}>{i18n.t('newRecord') || 'YENİ REKOR!'}</Text>
                                    </View>
                                )}
                                {rank && rank <= 10 && (
                                    <Text style={styles.rankText}>🌍 #{rank}</Text>
                                )}
                                <TouchableOpacity style={styles.restartBtn} onPress={startGame}>
                                    <Text style={styles.restartBtnText}>{i18n.t('restart') || 'Tekrar Dene'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.menuBtn} onPress={goToMenu}>
                                    <Text style={styles.menuBtnText}>{i18n.t('menu') || 'Menü'}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </View>
        </Modal>
    );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
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
        marginBottom: 8,
        height: 50,
    },
    headerBreakContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(217,119,6,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 15,
    },
    headerBreakValue: {
        fontSize: 14,
        fontWeight: '700',
        color: isDark ? '#fbbf24' : '#b45309',
        fontFamily: 'monospace',
    },
    backBtn: { padding: 5, width: 34 },
    title: { fontSize: 20, fontWeight: 'bold', color: isDark ? '#fff' : '#000' },
    // Start screen
    startScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 15 },
    startEmoji: { fontSize: 80 },
    startTitle: { fontSize: 32, fontWeight: 'bold', color: isDark ? '#fff' : '#000' },
    startHint: { fontSize: 14, color: isDark ? '#888' : '#999' },
    startButton: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#9c27b0', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25, marginTop: 10,
    },
    startButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    // Game area
    gameArea: { flex: 1, alignItems: 'center' },
    infoBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: BOARD_W,
        marginBottom: 8,
        paddingVertical: 6,
    },
    infoItem: { alignItems: 'center' },
    infoLabel: { fontSize: 10, fontWeight: '600', color: isDark ? '#888' : '#999', textTransform: 'uppercase', letterSpacing: 1 },
    infoValue: { fontSize: 18, fontWeight: 'bold', color: isDark ? '#fff' : '#000' },
    nextPreview: { alignItems: 'center' },
    nextPieceContainer: { position: 'relative', marginTop: 4 },
    // Board
    board: {
        width: BOARD_W,
        height: BOARD_H,
        backgroundColor: isDark ? '#111' : '#f0f0f0',
        borderWidth: 2,
        borderColor: isDark ? '#333' : '#ccc',
        position: 'relative',
        overflow: 'hidden',
    },
    gridLine: {
        position: 'absolute',
        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)',
    },
    cell: {
        position: 'absolute',
        width: CELL_SIZE - 1,
        height: CELL_SIZE - 1,
        borderRadius: 2,
    },
    ghostCell: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderStyle: 'dashed',
        opacity: 0.4,
    },
    pauseOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Controls
    controls: { marginTop: 12, alignItems: 'center' },
    controlRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    ctrlBtn: {
        width: 56, height: 56,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
        borderRadius: 14,
    },
    rotateBtn: { backgroundColor: '#9c27b0' },
    // Break timer
    breakTimerBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        marginTop: 12, paddingVertical: 8, paddingHorizontal: 16,
        backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(217,119,6,0.1)', borderRadius: 20,
    },
    breakTimerLabel: { fontSize: 13, fontWeight: '600', color: isDark ? '#f59e0b' : '#d97706' },
    breakTimerValue: { fontSize: 14, fontWeight: '700', color: isDark ? '#fbbf24' : '#b45309', letterSpacing: 1 },
    // Overlay
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center', alignItems: 'center', zIndex: 10,
    },
    overlayTitle: {
        fontSize: 40,
        fontWeight: '900',
        color: '#ef4444',
        marginBottom: 10,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
        textTransform: 'uppercase',
    },
    overlayScore: { fontSize: 20, color: '#ccc', marginBottom: 5 },
    overlayLines: { fontSize: 14, color: '#999', marginBottom: 20 },
    newRecordBadge: { backgroundColor: '#eab308', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15, marginBottom: 20 },
    newRecordText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
    restartBtn: { paddingHorizontal: 30, paddingVertical: 15, backgroundColor: '#9c27b0', borderRadius: 25, marginBottom: 10 },
    restartBtnText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    menuBtn: { paddingHorizontal: 30, paddingVertical: 10 },
    menuBtnText: { fontSize: 16, color: '#ccc' },
    rankText: { fontSize: 18, fontWeight: '700', color: '#fbbf24', marginBottom: 15 },
    // Menu extras
    highScoreText: { fontSize: 14, color: isDark ? '#aaa' : '#888', marginBottom: 4 },
    menuSecondaryBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        borderWidth: 2, borderColor: '#9c27b0',
        paddingHorizontal: 28, paddingVertical: 12, borderRadius: 25, marginTop: 4,
    },
    menuSecondaryBtnText: { color: '#9c27b0', fontSize: 16, fontWeight: '600' },
    menuExitBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 28, paddingVertical: 10, marginTop: 4,
    },
    menuExitBtnText: { color: isDark ? '#888' : '#999', fontSize: 15 },
    // Leaderboard
    leaderboardOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center', alignItems: 'center',
        zIndex: 20, borderRadius: 12,
    },
    leaderboardCard: {
        backgroundColor: isDark ? '#1e1e2e' : '#fff',
        borderRadius: 16, padding: 20,
        width: '90%', maxHeight: '80%',
    },
    leaderboardHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16,
    },
    leaderboardTitle: { fontSize: 18, fontWeight: 'bold', color: isDark ? '#fff' : '#000' },
    leaderboardEmpty: { textAlign: 'center', color: isDark ? '#888' : '#999', paddingVertical: 24, fontSize: 14 },
    leaderboardRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 10, borderBottomWidth: 1,
        borderBottomColor: isDark ? '#333' : '#f0f0f0',
    },
    leaderboardRank: { width: 36, fontSize: 18, textAlign: 'center' },
    leaderboardName: { flex: 1, fontSize: 14, fontWeight: '500', color: isDark ? '#ccc' : '#333', marginLeft: 6 },
    leaderboardScore: { fontSize: 14, fontWeight: '700', color: '#9c27b0' },
});
