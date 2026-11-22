import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants';
import CustomCard from './CustomCard';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  sublabel?: string;
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  color = colors.primary,
  sublabel,
  style,
}) => {
  return (
    <CustomCard style={[styles.card, style]}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
      </View>
    </CustomCard>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginHorizontal: 4,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textWrap: {
    flex: 1,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.dark,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },
  sublabel: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default StatCard;
