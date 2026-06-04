import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    View
} from 'react-native';

interface CongratsOverlayProps {
    visible: boolean;
    score: number;
    isNewRecord: boolean;
    rank?: number | null;
    isDark: boolean;
}

const EMOJIS = ['🎉', '🏆', '⭐', '🎊', '✨', '🥇', '💎', '🔥'];

export default function CongratsOverlay({ visible, score, isNewRecord, rank, isDark }: CongratsOverlayProps) {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const [particles, setParticles] = useState<{ id: number; emoji: string; x: number; y: number; anim: Animated.Value }[]>([]);

    useEffect(() => {
        if (visible && isNewRecord) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Trophy entrance animation
            Animated.sequence([
                Animated.spring(scaleAnim, {
                    toValue: 1.2,
                    friction: 3,
                    tension: 100,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 5,
                    useNativeDriver: true,
                }),
            ]).start();

            // Rotate trophy
            Animated.loop(
                Animated.sequence([
                    Animated.timing(rotateAnim, {
                        toValue: 0.05,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(rotateAnim, {
                        toValue: -0.05,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(rotateAnim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]),
                { iterations: 3 }
            ).start();

            // Particle emojis
            const newParticles = Array.from({ length: 12 }).map((_, i) => ({
                id: i,
                emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
                x: Math.random() * 300 - 150,
                y: Math.random() * 400 - 200,
                anim: new Animated.Value(0),
            }));
            setParticles(newParticles);

            newParticles.forEach((p, index) => {
                Animated.timing(p.anim, {
                    toValue: 1,
                    duration: 1200 + index * 100,
                    delay: index * 80,
                    useNativeDriver: true,
                }).start();
            });
        } else {
            scaleAnim.setValue(0);
            rotateAnim.setValue(0);
            setParticles([]);
        }
    }, [visible, isNewRecord]);

    if (!visible || !isNewRecord) return null;

    const spin = rotateAnim.interpolate({
        inputRange: [-1, 1],
        outputRange: ['-30deg', '30deg'],
    });

    return (
        <View style={styles.container} pointerEvents="none">
            {/* Floating particles */}
            {particles.map((p) => (
                <Animated.Text
                    key={p.id}
                    style={[
                        styles.particle,
                        {
                            transform: [
                                { translateX: p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, p.x] }) },
                                { translateY: p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, p.y] }) },
                                { scale: p.anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1.2, 0] }) },
                            ],
                            opacity: p.anim.interpolate({ inputRange: [0, 0.3, 0.8, 1], outputRange: [0, 1, 1, 0] }),
                        },
                    ]}
                >
                    {p.emoji}
                </Animated.Text>
            ))}

            {/* Trophy */}
            <Animated.View style={[styles.trophyContainer, { transform: [{ scale: scaleAnim }, { rotate: spin }] }]}>
                <Text style={styles.trophy}>🏆</Text>
            </Animated.View>

            {/* New Record text */}
            <Animated.View style={[styles.textContainer, { transform: [{ scale: scaleAnim }] }]}>
                <View style={styles.recordBadge}>
                    <Ionicons name="star" size={16} color="#000" />
                    <Text style={styles.recordText}>YENİ REKOR!</Text>
                    <Ionicons name="star" size={16} color="#000" />
                </View>
                <Text style={styles.scoreText}>{score.toLocaleString()}</Text>
                {rank && rank <= 10 && (
                    <Text style={styles.rankText}>
                        #{rank} 🌍
                    </Text>
                )}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    particle: {
        position: 'absolute',
        fontSize: 28,
    },
    trophyContainer: {
        marginBottom: 10,
    },
    trophy: {
        fontSize: 72,
    },
    textContainer: {
        alignItems: 'center',
    },
    recordBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fbbf24',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    recordText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#000',
        letterSpacing: 2,
    },
    scoreText: {
        fontSize: 36,
        fontWeight: '900',
        color: '#fff',
        marginTop: 8,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    rankText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fbbf24',
        marginTop: 4,
    },
});
