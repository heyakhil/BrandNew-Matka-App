import { StyleSheet } from 'react-native';
import { APP_COLORS } from '../../theme/paperTheme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.primaryBackground,
  },
  listContent: {
    padding: 16,
    paddingBottom: 28,
  },
  heading: {
    color: APP_COLORS.textPrimary,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  subheading: {
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
});
