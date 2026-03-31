import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const toggleLang = () => {
    const nextLang = currentLang === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <TouchableOpacity onPress={toggleLang} style={styles.container} activeOpacity={0.8}>
      <View style={[styles.pill, currentLang === 'en' && styles.activePill]}>
        <Text style={[styles.text, currentLang === 'en' && styles.activeText]}>EN</Text>
      </View>
      <View style={[styles.pill, currentLang === 'hi' && styles.activePill]}>
        <Text style={[styles.text, currentLang === 'hi' && styles.activeText]}>HI</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A', // C.card
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(201,162,39,0.35)', // C.borderGold
    padding: 3,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  activePill: {
    backgroundColor: '#C9A227', // C.gold
  },
  text: {
    color: '#666',
    fontSize: 12,
    fontWeight: '700',
  },
  activeText: {
    color: '#000',
  }
});
