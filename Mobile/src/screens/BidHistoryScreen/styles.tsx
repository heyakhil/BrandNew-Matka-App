import { StyleSheet } from 'react-native';
import { APP_COLORS } from '../../theme/paperTheme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.primaryBackground,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: APP_COLORS.secondary,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateLabel: {
    color: APP_COLORS.textPrimary,
    fontWeight: '700',
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listContent: {
    padding: 14,
    paddingBottom: 24,
  },
  emptyCard: {
    margin: 14,
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 44,
    paddingHorizontal: 20,
  },
  searchBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: APP_COLORS.primaryBackground,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  searchIconBg: {
    backgroundColor: 'transparent',
  },
  emptyTitle: {
    color: APP_COLORS.textPrimary,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
  },
  bidCard: {
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    marginBottom: 10,
  },
  bidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  bidMarket: {
    color: APP_COLORS.textPrimary,
    fontWeight: '800',
  },
  bidMeta: {
    color: APP_COLORS.textSecondary,
  },
  bidNumber: {
    color: APP_COLORS.accent,
    fontWeight: '800',
  },
  statusChip: {
    backgroundColor: APP_COLORS.accentMuted,
  },
  statusChipText: {
    color: APP_COLORS.accent,
    fontWeight: '700',
    fontSize: 11,
  },
});
