import { StyleSheet } from 'react-native';
import { APP_COLORS } from '../../theme/paperTheme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.primaryBackground,
  },
  listContent: {
    paddingBottom: 24,
  },
  cards: {
    paddingHorizontal: 12,
  },
});
