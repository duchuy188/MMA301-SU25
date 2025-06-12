import React, { useState, useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  Animated,
  Easing,
  View,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

export default function FloatingChatButton() {
  const [isExpanded, setIsExpanded] = useState(false);
  const slideIn = useRef(new Animated.Value(100)).current;
  const fadeText = useRef(new Animated.Value(0)).current;
  const scaleButton = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.7)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Slide vào khi mount với hiệu ứng bounce
  useEffect(() => {
    Animated.sequence([
      Animated.timing(slideIn, {
        toValue: 20,
        duration: 600,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(slideIn, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Floating animation liên tục
    const floatingLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: -3,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim, {
          toValue: 3,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    floatingLoop.start();

    // Glow animation liên tục
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.7,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();

    // Pulse animation cho notification dot
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      floatingLoop.stop();
      glowLoop.stop();
      pulseLoop.stop();
    };
  }, []);

  // Tự động thu gọn sau 2s
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isExpanded) {
      timer = setTimeout(() => {
        handleCollapse();
      }, 2000);
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isExpanded]);

  const handlePress = () => {
    // Haptic feedback và animation
    Animated.sequence([
      Animated.timing(scaleButton, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleButton, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      router.push('/chatbot');
    }, 200);
  };

  const handlePressIn = () => {
    if (isExpanded) return;
    
    // Thay vì dùng LayoutAnimation, sử dụng Animated.parallel
    setIsExpanded(true);
    Animated.parallel([
      Animated.spring(scaleButton, {
        toValue: 1.05,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(fadeText, {
        toValue: 1,
        duration: 300,
        delay: 150,
        useNativeDriver: true,
      }),
      Animated.timing(iconRotate, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCollapse = () => {
    // Xóa LayoutAnimation.configureNext
    Animated.parallel([
      Animated.timing(fadeText, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleButton, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(iconRotate, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setIsExpanded(false));
  };

  const iconRotateInterpolate = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          transform: [
            { translateX: slideIn },
            { translateY: floatingAnim },
          ],
        },
      ]}
    >
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glowEffect,
          {
            opacity: glowOpacity,
            width: isExpanded ? 140 : 56,
            transform: [{ scale: scaleButton }],
          },
        ]}
      />

      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={() => {}}
        activeOpacity={0.8}
        style={styles.touchable}
      >
        <Animated.View 
          style={[
            styles.buttonContainer, 
            {
              width: isExpanded ? 140 : 56,
              transform: [{ scale: scaleButton }],
            }
          ]}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2', '#f093fb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.innerContent}>
              {/* Main Icon */}
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [{ rotate: iconRotateInterpolate }],
                  },
                ]}
              >
                <View style={styles.chatIcon}>
                  <View style={styles.iconDot1} />
                  <View style={styles.iconDot2} />
                  <View style={styles.iconDot3} />
                </View>
              </Animated.View>

              {/* Text */}
              <Animated.Text
                style={[
                  styles.text,
                  {
                    opacity: fadeText,
                    transform: [
                      {
                        translateX: fadeText.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-10, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                💬 Hỗ trợ
              </Animated.Text>

              {/* Notification dot */}
              <View style={styles.notificationDot}>
                <Animated.View
                  style={[
                    styles.notificationInner,
                    {
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                />
              </View>
            </View>
          </LinearGradient>

          {/* Glass overlay */}
          <View style={styles.glassOverlay} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    zIndex: 1000,
  },
  touchable: {
    shadowColor: '#764ba2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonContainer: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    borderRadius: 28,
  },
  innerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    position: 'relative',
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatIcon: {
    width: 24,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  iconDot1: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#667eea',
  },
  iconDot2: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#764ba2',
  },
  iconDot3: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#f093fb',
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    minWidth: 70,
    textAlign: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 12,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff4757',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  notificationInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  glowEffect: {
    position: 'absolute',
    height: 56,
    borderRadius: 28,
    backgroundColor: '#764ba2',
    top: 0,
    left: 0,
  },
});
