import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PasswordStrengthMeterProps {
  password: string;
}

export const calculatePasswordStrength = (password: string) => {
  if (!password) return { score: 0, label: 'Yếu', color: '#FF4D4F' };

  let score = 0;


  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Độ phức tạp
  if (/[A-Z]/.test(password)) score += 1; 
  if (/[a-z]/.test(password)) score += 1; 
  if (/[0-9]/.test(password)) score += 1; 
  if (/[^A-Za-z0-9]/.test(password)) score += 1; 


  if (score === 0) return { score, label: 'Rất yếu', color: '#FF4D4F' };
  if (score <= 2) return { score, label: 'Yếu', color: '#FF4D4F' };
  if (score <= 4) return { score, label: 'Trung bình', color: '#FAAD14' };
  if (score <= 5) return { score, label: 'Mạnh', color: '#52C41A' };
  return { score, label: 'Rất mạnh', color: '#1890FF' };
};

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const getBarWidths = (score: number) => {
    const totalBars = 4;
    const barsToFill = Math.min(Math.ceil((score / 6) * totalBars), totalBars);
    return Array(totalBars).fill(0).map((_, i) => i < barsToFill);
  };

  const { score, label, color } = calculatePasswordStrength(password);
  const barWidths = getBarWidths(score);

  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        {barWidths.map((isFilled, index) => (
          <View
            key={index}
            style={[
              styles.bar,
              {
                backgroundColor: isFilled ? color : '#E8E8E8',
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 16,
  },
  barContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },
});

export default PasswordStrengthMeter;
