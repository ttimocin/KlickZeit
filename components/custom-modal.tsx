import { useTheme } from '@/context/ThemeContext';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

export interface ModalButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomModalProps {
  visible: boolean;
  title: string;
  message?: string;
  icon?: string;
  buttons?: ModalButton[];
  onClose?: () => void;
}

export const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  title,
  message,
  icon,
  buttons = [{ text: 'Tamam', style: 'default' }],
  onClose,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const handleButtonPress = (button: ModalButton) => {
    button.onPress?.();
    onClose?.();
  };

  const getButtonStyle = (style?: 'default' | 'cancel' | 'destructive') => {
    switch (style) {
      case 'destructive':
        return {
          bg: isDark ? '#5c2323' : '#ffebee',
          text: '#f44336',
        };
      case 'cancel':
        return {
          bg: isDark ? '#333' : '#f5f5f5',
          text: isDark ? '#999' : '#666',
        };
      default:
        return {
          bg: isDark ? '#1a4a1a' : '#e8f5e9',
          text: '#4CAF50',
        };
    }
  };

  const styles = createStyles(isDark);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Pressable>
            {icon && (
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{icon}</Text>
              </View>
            )}
            
            <Text style={styles.title}>{title}</Text>
            
            {message && (
              <Text style={styles.message}>{message}</Text>
            )}
            
            <View style={[
              styles.buttonContainer,
              buttons.length > 2 && styles.buttonContainerVertical
            ]}>
              {buttons.map((button, index) => {
                const buttonStyle = getButtonStyle(button.style);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      { backgroundColor: buttonStyle.bg },
                      buttons.length <= 2 && styles.buttonHorizontal,
                      buttons.length > 2 && styles.buttonVertical,
                    ]}
                    onPress={() => handleButtonPress(button)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.buttonText, { color: buttonStyle.text }]}>
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

// Modal state yönetimi için hook
interface ModalState {
  visible: boolean;
  title: string;
  message?: string;
  icon?: string;
  buttons?: ModalButton[];
}

export const useModal = () => {
  const [modalState, setModalState] = React.useState<ModalState>({
    visible: false,
    title: '',
  });

  const showModal = (options: Omit<ModalState, 'visible'>) => {
    setModalState({ ...options, visible: true });
  };

  const hideModal = () => {
    setModalState(prev => ({ ...prev, visible: false }));
  };

  const showSuccess = (title: string, message?: string, onOk?: () => void) => {
    showModal({
      title,
      message,
      icon: '✅',
      buttons: [{ text: 'Tamam', style: 'default', onPress: onOk }],
    });
  };

  const showError = (title: string, message?: string) => {
    showModal({
      title,
      message,
      icon: '❌',
      buttons: [{ text: 'Tamam', style: 'destructive' }],
    });
  };

  const showWarning = (title: string, message?: string) => {
    showModal({
      title,
      message,
      icon: '⚠️',
      buttons: [{ text: 'Tamam', style: 'default' }],
    });
  };

  const showInfo = (title: string, message?: string) => {
    showModal({
      title,
      message,
      icon: 'ℹ️',
      buttons: [{ text: 'Tamam', style: 'default' }],
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = 'Onayla',
    cancelText: string = 'İptal',
    isDestructive: boolean = false
  ) => {
    showModal({
      title,
      message,
      icon: isDestructive ? '🗑️' : '❓',
      buttons: [
        { text: cancelText, style: 'cancel' },
        { text: confirmText, style: isDestructive ? 'destructive' : 'default', onPress: onConfirm },
      ],
    });
  };

  return {
    modalState,
    showModal,
    hideModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    ModalComponent: () => (
      <CustomModal
        visible={modalState.visible}
        title={modalState.title}
        message={modalState.message}
        icon={modalState.icon}
        buttons={modalState.buttons}
        onClose={hideModal}
      />
    ),
  };
};

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    container: {
      width: width - 48,
      maxWidth: 340,
      backgroundColor: isDark ? '#1e1e1e' : '#fff',
      borderRadius: 24,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    icon: {
      fontSize: 48,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#fff' : '#333',
      textAlign: 'center',
      marginBottom: 8,
    },
    message: {
      fontSize: 15,
      color: isDark ? '#aaa' : '#666',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 24,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    buttonContainerVertical: {
      flexDirection: 'column',
    },
    button: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonHorizontal: {
      flex: 1,
    },
    buttonVertical: {
      width: '100%',
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default CustomModal;
