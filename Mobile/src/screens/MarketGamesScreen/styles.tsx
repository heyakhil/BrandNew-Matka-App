import { StyleSheet } from 'react-native';
import { APP_COLORS } from '../../theme/paperTheme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.primaryBackground,
  },
  headerTitle: {
    color: APP_COLORS.textPrimary,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.6,
    paddingVertical: 11,
  },
  gridContent: {
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  columnWrapper: {
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    marginBottom: 12,
  },
  cardDisabled: {
    opacity: 0.38,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  iconCircle: {
    marginBottom: 6,
  },
  accentBar: {
    width: '62%',
    height: 3,
    borderRadius: 2,
    marginBottom: 6,
  },
  cardTitle: {
    color: APP_COLORS.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },
});
