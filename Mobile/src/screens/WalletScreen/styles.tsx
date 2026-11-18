import { StyleSheet } from 'react-native';
import { APP_COLORS } from '../../theme/paperTheme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.primaryBackground,
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.secondary,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
    paddingRight: 12,
  },
  subHeaderTitle: {
    flex: 1,
    color: APP_COLORS.textPrimary,
    fontWeight: '800',
  },
  sheetModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  sheetSurface: {
    backgroundColor: APP_COLORS.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: APP_COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 26,
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: APP_COLORS.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    color: APP_COLORS.textPrimary,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  illustrationBadge: {
    alignSelf: 'center',
    backgroundColor: APP_COLORS.accentMuted,
    marginBottom: 16,
  },
  balanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.primaryBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    padding: 14,
    gap: 14,
    marginBottom: 16,
  },
  balanceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: APP_COLORS.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceAmount: {
    color: APP_COLORS.accent,
    fontWeight: '800',
  },
  balanceCaption: {
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
  fieldLabel: {
    color: APP_COLORS.textPrimary,
    fontWeight: '700',
    marginBottom: 8,
  },
  pillInput: {
    backgroundColor: APP_COLORS.primaryBackground,
    marginBottom: 12,
  },
  pillOutline: {
    borderRadius: 24,
  },
  quickChips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  quickChip: {
    backgroundColor: APP_COLORS.primaryBackground,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  quickChipText: {
    color: APP_COLORS.accent,
    fontWeight: '700',
    fontSize: 12,
  },
  primaryBtn: {
    borderRadius: 24,
    paddingVertical: 4,
    marginTop: 4,
  },
  primaryBtnLabel: {
    fontWeight: '800',
    fontSize: 15,
  },
  rulesBox: {
    marginTop: 16,
    gap: 6,
  },
  ruleText: {
    color: APP_COLORS.textSecondary,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  paginationText: {
    color: APP_COLORS.textSecondary,
    fontWeight: '600',
  },
  paginationBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  historyCard: {
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    marginBottom: 12,
  },
  historyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyDate: {
    color: APP_COLORS.textPrimary,
    fontWeight: '700',
  },
  sourceChip: {
    backgroundColor: APP_COLORS.primaryBackground,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  sourceChipText: {
    color: APP_COLORS.accent,
    fontSize: 10,
    fontWeight: '800',
  },
  tripleRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: APP_COLORS.border,
    paddingVertical: 10,
    marginBottom: 10,
  },
  tripleCol: {
    flex: 1,
    alignItems: 'center',
  },
  tripleLabel: {
    color: APP_COLORS.textSecondary,
    fontSize: 11,
  },
  tripleValue: {
    color: APP_COLORS.textPrimary,
    fontWeight: '800',
    marginTop: 2,
  },
  requestTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  requestTypeLabel: {
    color: APP_COLORS.textSecondary,
    fontSize: 11,
  },
  requestTypeVal: {
    color: APP_COLORS.textPrimary,
    fontWeight: '700',
  },
  addFundCard: {
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  addFundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: APP_COLORS.primaryBackground,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addFundHeaderText: {
    color: APP_COLORS.accent,
    fontWeight: '800',
  },
  addFundBody: {
    paddingVertical: 12,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: APP_COLORS.textSecondary,
  },
  detailVal: {
    color: APP_COLORS.textPrimary,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    marginTop: 12,
  },
  emptyText: {
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
