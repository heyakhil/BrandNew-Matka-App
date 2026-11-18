import { StyleSheet } from 'react-native';
import { APP_COLORS } from '../../theme/paperTheme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.primaryBackground,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
    backgroundColor: APP_COLORS.primaryBackground,
  },
  subHeaderTitle: {
    flex: 1,
    color: APP_COLORS.textPrimary,
    fontWeight: '800',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  datePill: {
    flex: 1,
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    paddingHorizontal: 16,
    height: 44,
    justifyContent: 'center',
  },
  dateText: {
    color: APP_COLORS.textPrimary,
    fontWeight: '600',
  },
  sideMenuWrap: {
    flex: 1,
  },
  sidePill: {
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    height: 44,
    justifyContent: 'center',
  },
  sidePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 16,
    paddingRight: 4,
  },
  sideChevron: {
    margin: 0,
  },
  menuContent: {
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  sideText: {
    color: APP_COLORS.textPrimary,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  digitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  digitBox: {
    width: '48.2%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 8,
  },
  digitCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: APP_COLORS.primaryBackground,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitCircleText: {
    color: APP_COLORS.accent,
    fontWeight: '800',
  },
  digitInput: {
    flex: 1,
    color: APP_COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 6,
  },
  entryCard: {
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    marginBottom: 14,
  },
  entryInput: {
    backgroundColor: APP_COLORS.primaryBackground,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flexInput: {
    flex: 1,
    backgroundColor: APP_COLORS.primaryBackground,
    marginBottom: 10,
  },
  oddEvenRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  oddEvenBtn: {
    flex: 1,
    borderRadius: 10,
  },
  addBtn: {
    borderRadius: 10,
    marginTop: 4,
  },
  bidItemCard: {
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    marginBottom: 8,
  },
  bidItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bidItemNum: {
    color: APP_COLORS.accent,
    fontWeight: '800',
  },
  bidItemMeta: {
    color: APP_COLORS.textSecondary,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: APP_COLORS.secondary,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statBlock: {
    flex: 1,
  },
  statLabel: {
    color: APP_COLORS.textSecondary,
  },
  statValue: {
    color: APP_COLORS.textPrimary,
    fontWeight: '800',
  },
  statAmount: {
    color: APP_COLORS.accent,
    fontWeight: '800',
  },
  placeBetBtn: {
    borderRadius: 24,
    minWidth: 124,
  },
  placeBetLabel: {
    fontWeight: '800',
  },
});
