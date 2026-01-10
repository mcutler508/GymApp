import React from 'react';
import { Image, StyleSheet } from 'react-native';

type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'expert';

interface Props {
  level: DifficultyLevel;
  size?: number;
}

const iconMap = {
  easy: require('../../assets/icons/Difficulty/Easy.png'),
  normal: require('../../assets/icons/Difficulty/Normal.png'),
  hard: require('../../assets/icons/Difficulty/Hard.png'),
  expert: require('../../assets/icons/Difficulty/Nope.png'),
};

export default function DifficultyIcon({ level, size = 40 }: Props) {
  return (
    <Image
      source={iconMap[level]}
      style={[styles.icon, { width: size, height: size }]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  icon: {
    // Additional styling if needed
  },
});
