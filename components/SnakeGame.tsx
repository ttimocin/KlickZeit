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
    GestureResponderEvent,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import CongratsOverlay from './CongratsOverlay';

interface SnakeGameProps {
    visible: boolean;
    onClose: () => void;
    breakStartTime?: number | null;
}

const { width } = Dimensions.get('window');
const BOARD_SIZE = 20;
const CELL_PX = Math.floor((width - 40) / BOARD_SIZE);
const GRID_PX = CELL_PX * BOARD_SIZE;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Point = { x: number; y: number };

const INITIAL_SNAKE: Point[] = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
];

const getRandomFood = (snake: Point[]): Point => {
    let food: Point;
    do {
        food = {
            x: Math.floor(Math.random() * BOARD_SIZE),
            y: Math.floor(Math.random() * BOARD_SIZE),
        };
    } while (snake.some(s => s.x === food.x && s.y === food.y));
    return food;
};

export default function SnakeGame({ visible, onClose, breakStartTime }: SnakeGameProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = createStyles(isDark);

    const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
    const [food, setFood] = useState<Point>({ x: 15, y: 10 });
    const [direction, setDirection] = useState<Direction>('RIGHT');
    const [isGameOver, setIsGameOver] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [speed, setSpeed] = useState(150);
    const [isNewRecord, setIsNewRecord] = useState(false);
    const [rank, setRank] = useState<number | null>(null);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [leaderboardData, setLeaderboardData] = useState<GameLeaderboardEntry[]>([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);

    // Break timer
    const [breakElapsed, setBreakElapsed] = useState<string | null>(null);

    // Refs for game loop
    const directionRef = useRef<Direction>('RIGHT');
    const snakeRef = useRef<Point[]>(INITIAL_SNAKE);
    const foodRef = useRef<Point>({ x: 15, y: 10 });
    const scoreRef = useRef(0);
    const speedRef = useRef(150);
    const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isPausedRef = useRef(false);

    // Swipe tracking
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (visible) {
            loadHighScore();
        }
    }, [visible]);

    // Break timer
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

    const loadHighScore = async () => {
        const hs = await getHighScore('snake');
        setHighScore(hs);
    };

    const startGame = () => {
        const initialSnake = [...INITIAL_SNAKE];
        const initialFood = getRandomFood(initialSnake);

        setSnake(initialSnake);
        setFood(initialFood);
        setDirection('RIGHT');
        setScore(0);
        setSpeed(150);
        setIsGameOver(false);
        setIsPlaying(true);
        setIsPaused(false);
        setIsNewRecord(false);
        setRank(null);

        snakeRef.current = initialSnake;
        foodRef.current = initialFood;
        directionRef.current = 'RIGHT';
        scoreRef.current = 0;
        speedRef.current = 150;
        isPausedRef.current = false;

        startGameLoop(150);
    };

    const startGameLoop = (interval: number) => {
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);

        gameLoopRef.current = setInterval(() => {
            if (isPausedRef.current) return;
            moveSnake();
        }, interval);
    };

    const moveSnake = useCallback(() => {
        const currentSnake = [...snakeRef.current];
        const head = { ...currentSnake[0] };
        const dir = directionRef.current;

        switch (dir) {
            case 'UP': head.y -= 1; break;
            case 'DOWN': head.y += 1; break;
            case 'LEFT': head.x -= 1; break;
            case 'RIGHT': head.x += 1; break;
        }

        // Wall collision
        if (head.x < 0 || head.x >= BOARD_SIZE || head.y < 0 || head.y >= BOARD_SIZE) {
            endGame();
            return;
        }

        // Self collision
        if (currentSnake.some(s => s.x === head.x && s.y === head.y)) {
            endGame();
            return;
        }

        const newSnake = [head, ...currentSnake];
        const currentFood = foodRef.current;

        // Eat food
        if (head.x === currentFood.x && head.y === currentFood.y) {
            const newScore = scoreRef.current + 10;
            scoreRef.current = newScore;

            const newFood = getRandomFood(newSnake);
            foodRef.current = newFood;

            // Speed up every 50 points
            if (newScore % 50 === 0 && speedRef.current > 60) {
                const newSpeed = speedRef.current - 10;
                speedRef.current = newSpeed;
                startGameLoop(newSpeed);
                setSpeed(newSpeed);
            }

            setScore(newScore);
            setFood(newFood);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
            newSnake.pop(); // Remove tail
        }

        snakeRef.current = newSnake;
        setSnake([...newSnake]);
    }, []);

    const endGame = async () => {
        if (gameLoopRef.current) {
            clearInterval(gameLoopRef.current);
            gameLoopRef.current = null;
        }
        setIsGameOver(true);
        setIsPlaying(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        const finalScore = scoreRef.current;
        await saveHighScore(finalScore, 'snake');
        const hs = await getHighScore('snake');
        setHighScore(hs);

        // Check if new record
        const wasNewRecord = finalScore > 0 && finalScore >= hs;
        setIsNewRecord(wasNewRecord);

        // Save to Firebase leaderboard
        await saveGameScore('snake', finalScore);
        const userRank = await getGameUserRank('snake');
        setRank(userRank);
    };

    const changeDirection = (newDir: Direction) => {
        const current = directionRef.current;
        // Prevent reversing
        if (
            (current === 'UP' && newDir === 'DOWN') ||
            (current === 'DOWN' && newDir === 'UP') ||
            (current === 'LEFT' && newDir === 'RIGHT') ||
            (current === 'RIGHT' && newDir === 'LEFT')
        ) return;

        directionRef.current = newDir;
        setDirection(newDir);
    };

    const togglePause = () => {
        isPausedRef.current = !isPausedRef.current;
        setIsPaused(!isPaused);
        Haptics.selectionAsync();
    };

    const handleBack = () => {
        if (isPlaying && !isGameOver) {
            isPausedRef.current = true;
            setIsPaused(true);
            Alert.alert(
                i18n.t('gameOver') || 'Oyun Bitti',
                i18n.t('quitGameConfirm') || 'Oyundan çıkmak istiyor musunuz?',
                [
                    {
                        text: i18n.t('cancel') || 'İptal',
                        style: 'cancel',
                        onPress: () => {
                            isPausedRef.current = false;
                            setIsPaused(false);
                        },
                    },
                    {
                        text: i18n.t('menu') || 'Menü',
                        style: 'destructive',
                        onPress: () => {
                            if (gameLoopRef.current) {
                                clearInterval(gameLoopRef.current);
                                gameLoopRef.current = null;
                            }
                            setIsPlaying(false);
                            setIsGameOver(false);
                            onClose();
                        },
                    },
                ]
            );
        } else {
            if (gameLoopRef.current) {
                clearInterval(gameLoopRef.current);
                gameLoopRef.current = null;
            }
            onClose();
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (gameLoopRef.current) {
                clearInterval(gameLoopRef.current);
                gameLoopRef.current = null;
            }
        };
    }, []);

    // Swipe handlers
    const handleTouchStart = (e: GestureResponderEvent) => {
        const { pageX, pageY } = e.nativeEvent;
        touchStartRef.current = { x: pageX, y: pageY };
    };

    const handleTouchEnd = (e: GestureResponderEvent) => {
        if (!touchStartRef.current || !isPlaying || isGameOver) return;
        const { pageX, pageY } = e.nativeEvent;
        const dx = pageX - touchStartRef.current.x;
        const dy = pageY - touchStartRef.current.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (Math.max(absDx, absDy) < 20) return; // Too short swipe

        if (absDx > absDy) {
            changeDirection(dx > 0 ? 'RIGHT' : 'LEFT');
        } else {
            changeDirection(dy > 0 ? 'DOWN' : 'UP');
        }
    };

    const renderGrid = () => {
        const cells: React.JSX.Element[] = [];

        // Food
        cells.push(
            <View
                key="food"
                style={[
                    styles.cell,
                    styles.food,
                    {
                        left: food.x * CELL_PX,
                        top: food.y * CELL_PX,
                    },
                ]}
            >
                <Text style={styles.foodEmoji}>🍎</Text>
            </View>
        );

        // Snake
        snake.forEach((segment, index) => {
            const isHead = index === 0;
            cells.push(
                <View
                    key={`snake-${index}`}
                    style={[
                        styles.cell,
                        isHead ? styles.snakeHead : styles.snakeBody,
                        {
                            left: segment.x * CELL_PX,
                            top: segment.y * CELL_PX,
                            borderRadius: isHead ? CELL_PX / 2 : CELL_PX / 4,
                        },
                    ]}
                />
            );
        });

        return cells;
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={handleBack}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
                    </TouchableOpacity>
                    <Text style={styles.title}>🐍 Snake</Text>
                    {isPlaying && !isGameOver ? (
                        <TouchableOpacity onPress={togglePause} style={styles.pauseButton}>
                            <Ionicons name={isPaused ? 'play' : 'pause'} size={24} color={isDark ? '#fff' : '#000'} />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.headerRight} />
                    )}
                </View>

                {/* Score Bar */}
                <View style={styles.scoreBar}>
                    <View style={styles.scoreItem}>
                        <Text style={styles.scoreLabel}>{i18n.t('score') || 'Skor'}</Text>
                        <Text style={styles.scoreValue}>{score}</Text>
                    </View>
                    <View style={styles.scoreItem}>
                        <Text style={styles.scoreLabel}>{i18n.t('best') || 'En İyi'}</Text>
                        <Text style={styles.scoreValue}>{highScore}</Text>
                    </View>
                </View>

                {!isPlaying && !isGameOver ? (
                    // Start Screen
                    <View style={styles.startScreen}>
                        <Text style={styles.startEmoji}>🐍</Text>
                        <Text style={styles.startTitle}>Snake</Text>
                        <Text style={styles.startHint}>{i18n.t('swipeToPlay') || 'Kaydırarak oyna'}</Text>
                        <TouchableOpacity style={styles.startButton} onPress={startGame}>
                            <Ionicons name="play" size={24} color="#fff" />
                            <Text style={styles.startButtonText}>{i18n.t('newGame') || 'Yeni Oyun'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.startButton, { backgroundColor: '#9c27b0', marginTop: 0 }]}
                            onPress={async () => {
                                setShowLeaderboard(true);
                                setLeaderboardLoading(true);
                                const data = await getGameLeaderboard('snake', 10);
                                setLeaderboardData(data);
                                setLeaderboardLoading(false);
                            }}
                        >
                            <Ionicons name="trophy" size={20} color="#fff" />
                            <Text style={styles.startButtonText}>{i18n.t('leaderboard') || 'Puan Tablosu'}</Text>
                        </TouchableOpacity>

                        {/* Break Timer on start screen */}
                        {breakElapsed && (
                            <View style={styles.breakTimerBar}>
                                <Ionicons name="cafe" size={16} color={isDark ? '#f59e0b' : '#d97706'} />
                                <Text style={styles.breakTimerLabel}>{i18n.t('breakTime') || 'Mola'}</Text>
                                <Text style={styles.breakTimerValue}>{breakElapsed}</Text>
                            </View>
                        )}

                        {/* Leaderboard overlay */}
                        {showLeaderboard && (
                            <View style={[styles.startScreen, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isDark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.97)', zIndex: 10, padding: 20 }]}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <Text style={[styles.startTitle, { fontSize: 20 }]}>🏆 {i18n.t('leaderboard') || 'Puan Tablosu'}</Text>
                                    <TouchableOpacity onPress={() => setShowLeaderboard(false)}>
                                        <Ionicons name="close" size={28} color={isDark ? '#fff' : '#000'} />
                                    </TouchableOpacity>
                                </View>
                                {leaderboardLoading ? (
                                    <Text style={styles.startHint}>{i18n.t('loading') || 'Yükleniyor...'}</Text>
                                ) : leaderboardData.length === 0 ? (
                                    <Text style={styles.startHint}>{i18n.t('noRecordsYet') || 'Henüz kayıt yok'}</Text>
                                ) : (
                                    <ScrollView style={{ width: '100%' }}>
                                        {leaderboardData.map((entry, idx) => (
                                            <View key={entry.userCode} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: isDark ? '#333' : '#eee' }}>
                                                <Text style={{ fontSize: 18, width: 40, textAlign: 'center' }}>
                                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                                                </Text>
                                                <Text style={{ flex: 1, fontSize: 15, color: isDark ? '#fff' : '#000' }} numberOfLines={1}>{entry.displayName}</Text>
                                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4caf50' }}>{entry.bestScore}</Text>
                                            </View>
                                        ))}
                                    </ScrollView>
                                )}
                            </View>
                        )}
                    </View>
                ) : (
                    // Game Area
                    <View style={styles.gameArea}>
                        {/* Grid */}
                        <View
                            style={styles.grid}
                            onTouchStart={handleTouchStart}
                            onTouchEnd={handleTouchEnd}
                        >
                            {/* Grid lines */}
                            {Array.from({ length: BOARD_SIZE + 1 }).map((_, i) => (
                                <View key={`h-${i}`} style={[styles.gridLine, styles.horizontalLine, { top: i * CELL_PX }]} />
                            ))}
                            {Array.from({ length: BOARD_SIZE + 1 }).map((_, i) => (
                                <View key={`v-${i}`} style={[styles.gridLine, styles.verticalLine, { left: i * CELL_PX }]} />
                            ))}
                            {renderGrid()}

                            {/* Paused overlay */}
                            {isPaused && (
                                <View style={styles.pauseOverlay}>
                                    <Ionicons name="pause-circle" size={64} color="rgba(255,255,255,0.8)" />
                                </View>
                            )}
                        </View>

                        {/* Direction Controls */}
                        <View style={styles.controlsContainer}>
                            <View style={styles.controlRow}>
                                <View style={styles.controlSpacer} />
                                <TouchableOpacity
                                    style={[styles.dirButton, direction === 'UP' && styles.dirButtonActive]}
                                    onPress={() => changeDirection('UP')}
                                >
                                    <Ionicons name="chevron-up" size={28} color={direction === 'UP' ? '#fff' : (isDark ? '#ccc' : '#666')} />
                                </TouchableOpacity>
                                <View style={styles.controlSpacer} />
                            </View>
                            <View style={styles.controlRow}>
                                <TouchableOpacity
                                    style={[styles.dirButton, direction === 'LEFT' && styles.dirButtonActive]}
                                    onPress={() => changeDirection('LEFT')}
                                >
                                    <Ionicons name="chevron-back" size={28} color={direction === 'LEFT' ? '#fff' : (isDark ? '#ccc' : '#666')} />
                                </TouchableOpacity>
                                <View style={styles.dirCenter}>
                                    <Text style={styles.dirCenterText}>{score}</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.dirButton, direction === 'RIGHT' && styles.dirButtonActive]}
                                    onPress={() => changeDirection('RIGHT')}
                                >
                                    <Ionicons name="chevron-forward" size={28} color={direction === 'RIGHT' ? '#fff' : (isDark ? '#ccc' : '#666')} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.controlRow}>
                                <View style={styles.controlSpacer} />
                                <TouchableOpacity
                                    style={[styles.dirButton, direction === 'DOWN' && styles.dirButtonActive]}
                                    onPress={() => changeDirection('DOWN')}
                                >
                                    <Ionicons name="chevron-down" size={28} color={direction === 'DOWN' ? '#fff' : (isDark ? '#ccc' : '#666')} />
                                </TouchableOpacity>
                                <View style={styles.controlSpacer} />
                            </View>
                        </View>

                        {/* Break Timer */}
                        {breakElapsed && (
                            <View style={styles.breakTimerBar}>
                                <Ionicons name="cafe" size={16} color={isDark ? '#f59e0b' : '#d97706'} />
                                <Text style={styles.breakTimerLabel}>{i18n.t('breakTime') || 'Mola'}</Text>
                                <Text style={styles.breakTimerValue}>{breakElapsed}</Text>
                            </View>
                        )}

                        {/* Game Over Overlay */}
                        {isGameOver && (
                            <View style={styles.overlay}>
                                <CongratsOverlay
                                    visible={isGameOver}
                                    score={score}
                                    isNewRecord={isNewRecord}
                                    rank={rank}
                                    isDark={isDark}
                                />
                                <Text style={styles.overlayTitle}>{i18n.t('gameOver') || 'Oyun Bitti!'}</Text>
                                <Text style={styles.overlayScore}>{i18n.t('score') || 'Skor'}: {score}</Text>
                                {isNewRecord && (
                                    <View style={styles.newRecordBadge}>
                                        <Text style={styles.newRecordText}>{i18n.t('newRecord') || 'YENİ REKOR!'}</Text>
                                    </View>
                                )}
                                {rank && rank <= 10 && (
                                    <Text style={styles.rankText}>🌍 #{rank}</Text>
                                )}
                                <TouchableOpacity style={styles.restartButton} onPress={startGame}>
                                    <Text style={styles.restartButtonText}>{i18n.t('restart') || 'Tekrar Dene'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.menuButton} onPress={handleBack}>
                                    <Text style={styles.menuButtonText}>{i18n.t('menu') || 'Menü'}</Text>
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
        marginBottom: 10,
    },
    backButton: { padding: 5 },
    pauseButton: { padding: 5 },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: isDark ? '#fff' : '#000',
    },
    headerRight: { width: 34 },
    // Score
    scoreBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 40,
        marginBottom: 15,
    },
    scoreItem: { alignItems: 'center' },
    scoreLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: isDark ? '#888' : '#999',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    scoreValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: isDark ? '#fff' : '#000',
    },
    // Start Screen
    startScreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 15,
    },
    startEmoji: { fontSize: 80 },
    startTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: isDark ? '#fff' : '#000',
    },
    startHint: {
        fontSize: 14,
        color: isDark ? '#888' : '#999',
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#22c55e',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
        marginTop: 10,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Game
    gameArea: {
        flex: 1,
        alignItems: 'center',
    },
    grid: {
        width: GRID_PX,
        height: GRID_PX,
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
    horizontalLine: {
        left: 0,
        right: 0,
        height: 1,
    },
    verticalLine: {
        top: 0,
        bottom: 0,
        width: 1,
    },
    cell: {
        position: 'absolute',
        width: CELL_PX,
        height: CELL_PX,
    },
    snakeHead: {
        backgroundColor: '#22c55e',
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
        elevation: 5,
    },
    snakeBody: {
        backgroundColor: '#16a34a',
    },
    food: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    foodEmoji: {
        fontSize: CELL_PX * 0.8,
    },
    // Pause overlay
    pauseOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Controls
    controlsContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    controlRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    controlSpacer: {
        width: 60,
        height: 60,
    },
    dirButton: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
        borderRadius: 15,
        margin: 3,
    },
    dirButtonActive: {
        backgroundColor: '#22c55e',
    },
    dirCenter: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 3,
    },
    dirCenterText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: isDark ? '#666' : '#ccc',
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
        letterSpacing: 1,
    },
    // Game Over Overlay
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
    overlayScore: {
        fontSize: 20,
        color: '#ccc',
        marginBottom: 20,
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
    restartButton: {
        paddingHorizontal: 30,
        paddingVertical: 15,
        backgroundColor: '#22c55e',
        borderRadius: 25,
        marginBottom: 10,
    },
    restartButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    menuButton: {
        paddingHorizontal: 30,
        paddingVertical: 10,
    },
    menuButtonText: {
        fontSize: 16,
        color: '#ccc',
    },
    rankText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fbbf24',
        marginBottom: 15,
    },
});
