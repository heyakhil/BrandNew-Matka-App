import { StyleSheet } from 'react-native';
import { APP_COLORS } from '../../theme/paperTheme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.primaryBackground,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  sectionTitle: {
    color: APP_COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
  },
  fields: {
    gap: 12,
  },
  error: {
    color: APP_COLORS.danger,
    fontSize: 13,
    marginLeft: 16,
  },
  methods: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  footer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
