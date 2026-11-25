import React, { useMemo, useRef, useState } from 'react';
import { ScrollView, TextInput as RNTextInput, View } from 'react-native';
import {
  Button,
  Card,
  HelperText,
  IconButton,
  Menu,
  Surface,
  Text,
  TouchableRipple,
} from 'react-native-paper';
import { FormInput } from '../../components/molecules/FormInput';
import { GAME_WIN_RATES } from '../../data/mockData';
import { APP_COLORS } from '../../theme/paperTheme';
import type {
  GameTypeId,
  MarketGameOption,
  MarketItem,
  SessionSide,
} from '../../types/matka';
import { formatRupees, getPannasForAnk, validateGameInput } from '../../utils/matkaHelpers';
import { stakeForItem } from '../../services/bets';
import { styles } from './styles';

export interface SubmittedBidItem {
  gameCode: GameTypeId;
  gameName: string;
  side: SessionSide | 'full';
  number: string;
  stakeRupees: number;
  potentialWinRupees: number;
  halfVariant?: 'openPannaCloseAnk' | 'openAnkClosePanna';
}

interface PlayGameScreenProps {
  market: MarketItem;
  game: MarketGameOption;
  balanceRupees: number;
  onBack: () => void;
  onPlaceBets: (items: SubmittedBidItem[], requestId: string) => Promise<void>;
}

const SINGLE_DIGIT_ORDER = ['1', '6', '2', '7', '3', '8', '4', '9', '5', '0'];
const BULK_DIGIT_ORDER = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const PANNA_BULK_DIGIT_ORDER = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const ALL_JODIS = Array.from({ length: 100 }, (_, i) => String(i).padStart(2, '0'));

export const PlayGameScreen: React.FC<PlayGameScreenProps> = ({
  market,
  game,
  balanceRupees,
  onBack,
  onPlaceBets,
}) => {
  const isCloseOnly = market.status === 'close_running';
  const [side, setSide] = useState<SessionSide>(isCloseOnly ? 'close' : 'open');
  const [sideMenuOpen, setSideMenuOpen] = useState(false);

  // Single Digit grid state (1..9, 0)
  const [digitAmounts, setDigitAmounts] = useState<Record<string, string>>({});

  // Generic entry state for all other games
  const [primaryInput, setPrimaryInput] = useState('');
  const [secondaryInput, setSecondaryInput] = useState('');
  const [stakeText, setStakeText] = useState('10');
  const [oddEvenChoice, setOddEvenChoice] = useState<'ODD' | 'EVEN'>('ODD');
  const [halfVariant, setHalfVariant] = useState<'openPannaCloseAnk' | 'openAnkClosePanna'>('openPannaCloseAnk');
  const [addedBids, setAddedBids] = useState<SubmittedBidItem[]>([]);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const requestRef = useRef<{ signature: string; id: string } | null>(null);

  const todayLabel = useMemo(() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }, []);

  const rateMultiplier = useMemo(() => {
    const rateKey = ({ SD: 'single', JD: 'jodi', RB: 'jodi', SP: 'sp', DP: 'dp', TP: 'tp', HS: 'halfSangam', FS: 'fullSangam' } as const)[game.rateKey];
    const liveRate = market.rateCard?.[rateKey];
    if (liveRate) return liveRate.numerator / liveRate.denominator;
    const rate = GAME_WIN_RATES.find(r => r.code === game.rateKey);
    return rate ? rate.rateMultiplier : 9.5;
  }, [game.rateKey, market.rateCard]);

  const minStake = (market.limits?.minPaise ?? 1000) / 100;
  const maxStake = (market.limits?.maxPaise ?? 1000000) / 100;

  const effectiveSide: SessionSide | 'full' = game.requiresSide
    ? isCloseOnly
      ? 'close'
      : side
    : 'full';

  const singleDigitBids: SubmittedBidItem[] = useMemo(() => {
    if (game.id !== 'SD') {
      return [];
    }
    return SINGLE_DIGIT_ORDER.reduce<SubmittedBidItem[]>((acc, digit) => {
      const amount = Number(digitAmounts[digit] ?? 0);
      if (amount > 0) {
        acc.push({
          gameCode: game.id,
          gameName: game.title,
          side: effectiveSide,
          number: digit,
          stakeRupees: amount,
          potentialWinRupees: amount * rateMultiplier,
        });
      }
      return acc;
    }, []);
  }, [game.id, game.title, digitAmounts, effectiveSide, rateMultiplier]);

  const activeBids = game.id === 'SD' ? singleDigitBids : addedBids;

  const totalBidsCount = activeBids.reduce((sum, bid) => sum + stakeForItem(bid) / bid.stakeRupees, 0);
  const totalAmount = useMemo(
    () => activeBids.reduce((sum, b) => sum + stakeForItem(b), 0),
    [activeBids],
  );

  const handleReset = (): void => {
    setDigitAmounts({});
    setAddedBids([]);
    setPrimaryInput('');
    setSecondaryInput('');
    setErrorText(null);
  };

  const handleToggleBulkNumber = (num: string): void => {
    const stake = Number(stakeText) || 0;
    if (stake < minStake || stake > maxStake) {
      setErrorText(`Amount must be between ₹${minStake} and ₹${maxStake}.`);
      return;
    }
    setErrorText(null);
    setAddedBids(prev => {
      const exists = prev.some(b => b.number === num && b.side === effectiveSide);
      if (exists) {
        return prev.filter(b => !(b.number === num && b.side === effectiveSide));
      }
      return [
        {
          gameCode: game.id,
          gameName: game.title,
          side: effectiveSide,
          number: num,
          stakeRupees: stake,
          potentialWinRupees: stake * rateMultiplier,
        },
        ...prev,
      ];
    });
  };

  const handleAddPannaBulkAnk = (digit: string): void => {
    const stake = Number(stakeText) || 0;
    if (stake < minStake || stake > maxStake) {
      setErrorText(`Amount must be between ₹${minStake} and ₹${maxStake}.`);
      return;
    }
    const kind = game.id === 'SPB' ? 'SP' : 'DP';
    const pannas = getPannasForAnk(Number(digit), kind);
    setErrorText(null);
    setAddedBids(prev => {
      const existing = new Set(
        prev.filter(b => b.side === effectiveSide).map(b => b.number),
      );
      const nextItems: SubmittedBidItem[] = pannas
        .filter(p => !existing.has(p))
        .map(panna => ({
          gameCode: game.id,
          gameName: game.title,
          side: effectiveSide,
          number: panna,
          stakeRupees: stake,
          potentialWinRupees: stake * rateMultiplier,
        }));
      return [...nextItems, ...prev];
    });
  };

  const handleAddSingleBid = (): void => {
    const stake = Number(stakeText) || 0;
    if (stake < minStake || stake > maxStake) {
      setErrorText(`Amount must be between ₹${minStake} and ₹${maxStake}.`);
      return;
    }

    if (game.id === 'OE') {
      const digits =
        oddEvenChoice === 'ODD'
          ? ['1', '3', '5', '7', '9']
          : ['0', '2', '4', '6', '8'];
      const batch: SubmittedBidItem[] = digits.map(d => ({
        gameCode: game.id,
        gameName: game.title,
        side: effectiveSide,
        number: d,
        stakeRupees: stake,
        potentialWinRupees: stake * rateMultiplier,
      }));
      setAddedBids(prev => [...batch, ...prev]);
      setErrorText(null);
      return;
    }

    const validation = validateGameInput(
      game.id,
      primaryInput,
      secondaryInput,
    );
    if (!validation.valid) {
      setErrorText(validation.error ?? 'Invalid input.');
      return;
    }

    const newItem: SubmittedBidItem = {
      gameCode: game.id,
      gameName: game.title,
      side: effectiveSide,
      number: validation.formattedNumber,
      stakeRupees: stake,
      potentialWinRupees: stake * rateMultiplier,
      ...(game.id === 'HS' ? { halfVariant } : {}),
    };
    setAddedBids(prev => [newItem, ...prev]);
    setPrimaryInput('');
    setSecondaryInput('');
    setErrorText(null);
  };

  const handleSubmitAll = async (): Promise<void> => {
    if (activeBids.length === 0) {
      return;
    }
    if (game.id === 'SD') {
      const invalid = activeBids.find(
        b => b.stakeRupees < minStake || b.stakeRupees > maxStake,
      );
      if (invalid) {
        setErrorText(`Each digit amount must be between ₹${minStake} and ₹${maxStake}.`);
        return;
      }
    }
    if (totalAmount > balanceRupees) {
      setErrorText('Insufficient wallet balance.');
      return;
    }
    const signature = JSON.stringify(activeBids);
    if (requestRef.current?.signature !== signature) {
      requestRef.current = { signature, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` };
    }
    setSubmitting(true);
    try { await onPlaceBets(activeBids, requestRef.current.id); }
    catch (error) { setErrorText(error instanceof Error ? error.message : 'Unable to place bets.'); }
    finally { setSubmitting(false); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.subHeader}>
        <IconButton
          icon="arrow-left"
          iconColor={APP_COLORS.textPrimary}
          onPress={onBack}
          accessibilityLabel="Back to market games"
        />
        <Text variant="titleMedium" style={styles.subHeaderTitle} numberOfLines={1}>
          {market.name} - {game.title}
        </Text>
      </View>

      <View style={styles.controlsRow}>
        <Surface style={styles.datePill} elevation={0}>
          <Text variant="bodyMedium" style={styles.dateText}>
            {todayLabel}
          </Text>
        </Surface>

        {game.requiresSide ? (
          <View style={styles.sideMenuWrap}>
            <Menu
              visible={sideMenuOpen}
              onDismiss={() => setSideMenuOpen(false)}
              anchorPosition="bottom"
              contentStyle={styles.menuContent}
              anchor={
                <TouchableRipple
                  onPress={() => setSideMenuOpen(true)}
                  borderless
                  style={styles.sidePill}>
                  <View style={styles.sidePillRow}>
                    <Text variant="bodyMedium" style={styles.sideText}>
                      {effectiveSide === 'open' ? 'Open' : 'Close'}
                    </Text>
                    <View pointerEvents="none">
                      <IconButton
                        icon="chevron-down"
                        size={18}
                        iconColor={APP_COLORS.textSecondary}
                        style={styles.sideChevron}
                      />
                    </View>
                  </View>
                </TouchableRipple>
              }>
              <Menu.Item
                title="Open"
                disabled={isCloseOnly}
                titleStyle={{
                  color: isCloseOnly
                    ? APP_COLORS.textSecondary
                    : APP_COLORS.textPrimary,
                }}
                onPress={() => {
                  setSide('open');
                  setSideMenuOpen(false);
                }}
              />
              <Menu.Item
                title="Close"
                titleStyle={{ color: APP_COLORS.textPrimary }}
                onPress={() => {
                  setSide('close');
                  setSideMenuOpen(false);
                }}
              />
            </Menu>
          </View>
        ) : (
          <Surface style={styles.datePill} elevation={0}>
            <Text variant="bodyMedium" style={styles.sideText}>
              Full Market
            </Text>
          </Surface>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {game.id === 'SD' ? (
          <View>
            <View style={styles.digitGrid}>
              {SINGLE_DIGIT_ORDER.map(digit => (
                <Surface key={digit} style={styles.digitBox} elevation={0}>
                  <View style={styles.digitCircle}>
                    <Text variant="labelLarge" style={styles.digitCircleText}>
                      {digit}
                    </Text>
                  </View>
                  <RNTextInput
                    value={digitAmounts[digit] ?? ''}
                    onChangeText={val => {
                      const cleaned = val.replace(/\D/g, '');
                      setDigitAmounts(prev => ({ ...prev, [digit]: cleaned }));
                      setErrorText(null);
                    }}
                    placeholder={`₹${minStake}-₹${maxStake}`}
                    placeholderTextColor={APP_COLORS.textSecondary}
                    keyboardType="number-pad"
                    maxLength={5}
                    style={styles.digitInput}
                  />
                </Surface>
              ))}
            </View>
            <Button
              mode="outlined"
              onPress={handleReset}
              textColor={APP_COLORS.textPrimary}
              style={styles.resetBtn}>
              Reset
            </Button>
          </View>
        ) : game.id === 'SDB' || game.id === 'JDB' || game.id === 'SPB' || game.id === 'DPB' ? (
          <View>
            <Card style={styles.entryCard} mode="contained">
              <Card.Content>
                <FormInput
                  label={`Enter Amount (₹${minStake} – ₹${maxStake})`}
                  value={stakeText}
                  onChangeText={val => {
                    setStakeText(val.replace(/\D/g, ''));
                    setErrorText(null);
                  }}
                  keyboardType="number-pad"
                  maxLength={5}
                  containerStyle={styles.entryInput}
                />

                {game.id === 'JDB' ? (
                  <View style={styles.jodiBulkGrid}>
                    {ALL_JODIS.map(jodi => {
                      const selected = addedBids.some(
                        b => b.number === jodi && b.side === effectiveSide,
                      );
                      return (
                        <TouchableRipple
                          key={jodi}
                          onPress={() => handleToggleBulkNumber(jodi)}
                          borderless
                          style={[
                            styles.jodiBulkBtn,
                            selected && styles.jodiBulkBtnSelected,
                          ]}>
                          <Text
                            style={[
                              styles.jodiBulkBtnText,
                              selected && styles.jodiBulkBtnTextSelected,
                            ]}>
                            {jodi}
                          </Text>
                        </TouchableRipple>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.keypadGrid}>
                    {(game.id === 'SDB' ? BULK_DIGIT_ORDER : PANNA_BULK_DIGIT_ORDER).map(digit => {
                      const selected =
                        game.id === 'SDB' &&
                        addedBids.some(
                          b => b.number === digit && b.side === effectiveSide,
                        );
                      return (
                        <TouchableRipple
                          key={digit}
                          onPress={() =>
                            game.id === 'SDB'
                              ? handleToggleBulkNumber(digit)
                              : handleAddPannaBulkAnk(digit)
                          }
                          borderless
                          style={[
                            styles.keypadBtn,
                            selected && styles.keypadBtnSelected,
                          ]}>
                          <Text
                            style={[
                              styles.keypadBtnText,
                              selected && styles.keypadBtnTextSelected,
                            ]}>
                            {digit}
                          </Text>
                        </TouchableRipple>
                      );
                    })}
                  </View>
                )}

                <Button
                  mode="outlined"
                  onPress={handleReset}
                  textColor={APP_COLORS.textPrimary}
                  style={styles.resetBtn}>
                  Reset
                </Button>
              </Card.Content>
            </Card>

            {addedBids.map((bid, idx) => (
              <Card key={`${bid.number}-${bid.side}-${idx}`} style={styles.bidItemCard} mode="contained">
                <Card.Content style={styles.bidItemRow}>
                  <View>
                    <Text variant="titleSmall" style={styles.bidItemNum}>
                      #{bid.number} ({bid.side.toUpperCase()})
                    </Text>
                    <Text variant="labelSmall" style={styles.bidItemMeta}>
                      Stake: {formatRupees(stakeForItem(bid))} • Est. Win:{' '}
                      {formatRupees(bid.potentialWinRupees)}
                    </Text>
                  </View>
                  <IconButton
                    icon="delete-outline"
                    iconColor={APP_COLORS.danger}
                    size={20}
                    onPress={() =>
                      setAddedBids(prev => prev.filter((_, i) => i !== idx))
                    }
                  />
                </Card.Content>
              </Card>
            ))}
          </View>
        ) : (
          <View>
            <Card style={styles.entryCard} mode="contained">
              <Card.Content>
                {game.id === 'OE' ? (
                  <View style={styles.oddEvenRow}>
                    <Button
                      mode={oddEvenChoice === 'ODD' ? 'contained' : 'outlined'}
                      onPress={() => setOddEvenChoice('ODD')}
                      buttonColor={
                        oddEvenChoice === 'ODD'
                          ? APP_COLORS.accent
                          : APP_COLORS.primaryBackground
                      }
                      textColor={
                        oddEvenChoice === 'ODD'
                          ? APP_COLORS.onAccent
                          : APP_COLORS.textPrimary
                      }
                      style={styles.oddEvenBtn}>
                      ODD (1,3,5,7,9)
                    </Button>
                    <Button
                      mode={oddEvenChoice === 'EVEN' ? 'contained' : 'outlined'}
                      onPress={() => setOddEvenChoice('EVEN')}
                      buttonColor={
                        oddEvenChoice === 'EVEN'
                          ? APP_COLORS.accent
                          : APP_COLORS.primaryBackground
                      }
                      textColor={
                        oddEvenChoice === 'EVEN'
                          ? APP_COLORS.onAccent
                          : APP_COLORS.textPrimary
                      }
                      style={styles.oddEvenBtn}>
                      EVEN (0,2,4,6,8)
                    </Button>
                  </View>
                ) : (
                  <View style={styles.inputRow}>
                    <FormInput
                      label={
                        game.id === 'HS'
                          ? 'Panna (3 digits)'
                          : game.id === 'FS'
                          ? 'Open Panna'
                          : game.id === 'SPM' || game.id === 'DPM'
                          ? 'Digits (e.g. 2479)'
                          : game.id === 'TDP'
                          ? '2 Anchor Digits'
                          : game.id === 'JD' || game.id === 'GJ' || game.id === 'RB'
                          ? 'Enter Two digit (00-99)'
                          : game.id === 'SP' || game.id === 'DP' || game.id === 'TP' || game.id === 'CP'
                          ? 'Enter three digit'
                          : game.id === 'SDT'
                          ? 'Enter Ank (0-9)'
                          : `Enter ${game.title}`
                      }
                      value={primaryInput}
                      onChangeText={val => {
                        setPrimaryInput(val.replace(/\D/g, ''));
                        setErrorText(null);
                      }}
                      keyboardType="number-pad"
                      maxLength={
                        game.id === 'SDT'
                          ? 1
                          : game.id === 'JD' || game.id === 'GJ' || game.id === 'RB' || game.id === 'TDP'
                          ? 2
                          : game.id === 'SP' || game.id === 'DP' || game.id === 'TP' || game.id === 'CP' || game.id === 'HS' || game.id === 'FS'
                          ? 3
                          : 10
                      }
                      containerStyle={styles.flexInput}
                    />
                    {(game.id === 'HS' || game.id === 'FS') && (
                      <FormInput
                        label={game.id === 'HS' ? 'Other Ank' : 'Close Panna'}
                        value={secondaryInput}
                        onChangeText={val => {
                          setSecondaryInput(val.replace(/\D/g, ''));
                          setErrorText(null);
                        }}
                        keyboardType="number-pad"
                        maxLength={game.id === 'HS' ? 1 : 3}
                        containerStyle={styles.flexInput}
                      />
                    )}
                  </View>
                )}

                {game.id === 'HS' && (
                  <View style={styles.oddEvenRow}>
                    <Button mode={halfVariant === 'openPannaCloseAnk' ? 'contained' : 'outlined'} onPress={() => setHalfVariant('openPannaCloseAnk')}>Open panna + Close ank</Button>
                    <Button mode={halfVariant === 'openAnkClosePanna' ? 'contained' : 'outlined'} onPress={() => setHalfVariant('openAnkClosePanna')}>Open ank + Close panna</Button>
                  </View>
                )}
                <FormInput
                  label={`Points / Amount (₹${minStake} – ₹${maxStake})`}
                  value={stakeText}
                  onChangeText={val => {
                    setStakeText(val.replace(/\D/g, ''));
                    setErrorText(null);
                  }}
                  keyboardType="number-pad"
                  maxLength={5}
                  containerStyle={styles.entryInput}
                />

                <Button
                  mode="contained"
                  onPress={handleAddSingleBid}
                  buttonColor={APP_COLORS.accent}
                  textColor={APP_COLORS.onAccent}
                  style={styles.addBtn}>
                  Add Bid
                </Button>

                <Button
                  mode="outlined"
                  onPress={handleReset}
                  textColor={APP_COLORS.textPrimary}
                  style={styles.resetBtn}>
                  Reset
                </Button>
              </Card.Content>
            </Card>

            {addedBids.map((bid, idx) => (
              <Card key={`${bid.number}-${idx}`} style={styles.bidItemCard} mode="contained">
                <Card.Content style={styles.bidItemRow}>
                  <View>
                    <Text variant="titleSmall" style={styles.bidItemNum}>
                      #{bid.number} ({bid.side.toUpperCase()})
                    </Text>
                    <Text variant="labelSmall" style={styles.bidItemMeta}>
                      Stake: {formatRupees(stakeForItem(bid))} •{' '}
                      {['SDT', 'CP', 'TDP'].includes(bid.gameCode)
                        ? 'Win rate depends on the winning panna'
                        : `Est. Win: ${formatRupees(bid.potentialWinRupees)}`}
                    </Text>
                  </View>
                  <IconButton
                    icon="delete-outline"
                    iconColor={APP_COLORS.danger}
                    size={20}
                    onPress={() =>
                      setAddedBids(prev => prev.filter((_, i) => i !== idx))
                    }
                  />
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {errorText && (
          <HelperText type="error" visible={Boolean(errorText)}>
            {errorText}
          </HelperText>
        )}
      </ScrollView>

      <Surface style={styles.bottomBar} elevation={4}>
        <View style={styles.statBlock}>
          <Text variant="labelSmall" style={styles.statLabel}>
            Total Bids
          </Text>
          <Text variant="titleMedium" style={styles.statValue}>
            {totalBidsCount}
          </Text>
        </View>
        <View style={styles.statBlock}>
          <Text variant="labelSmall" style={styles.statLabel}>
            Total Amount
          </Text>
          <Text variant="titleMedium" style={styles.statAmount}>
            {formatRupees(totalAmount)}
          </Text>
        </View>
        <Button
          mode="contained"
          disabled={totalBidsCount === 0 || submitting}
          onPress={() => { void handleSubmitAll(); }}
          buttonColor={
            totalBidsCount > 0 ? APP_COLORS.accent : APP_COLORS.border
          }
          textColor={
            totalBidsCount > 0
              ? APP_COLORS.onAccent
              : APP_COLORS.textSecondary
          }
          style={styles.placeBetBtn}
          labelStyle={styles.placeBetLabel}>
          Place Bet
        </Button>
      </Surface>
    </View>
  );
};
