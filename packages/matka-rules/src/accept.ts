import { MatkaRulesError } from './errors';
import {
  assertSide,
  createFullSangamSlip,
  createHalfSangamSlip,
  createJodiSlip,
  createPannaSlip,
  createSingleSlip,
  expandCyclePatti,
  expandDpMotor,
  expandJodiBulk,
  expandJodiFamily,
  expandPannaBulk,
  expandPannaFamily,
  expandRedJodi,
  expandSdDpTp,
  expandSingleBulk,
  expandSpMotor,
  type HalfSangamVariant,
  type SessionSide,
  type Slip,
} from './expand';
import { normalizePanna } from './panna';
import { assertStakePaise, rateFor, type Rate, type RateCard, type StakeLimits } from './rates';
import { rateKeyForSlip, type RateKey } from './settle';

export type BettingPhase = 'preOpen' | 'afterOpenCutoff' | 'closed' | 'cancelled';

interface SingleRequest {
  game: 'single';
  side: SessionSide;
  ank: number;
  stakePaise: number;
}

interface SingleBulkRequest {
  game: 'singleBulk';
  side: SessionSide;
  anks: readonly number[];
  stakePaise: number;
}

interface JodiRequest {
  game: 'jodi';
  jodi: string;
  stakePaise: number;
}

interface JodiBulkRequest {
  game: 'jodiBulk';
  jodis: readonly string[];
  stakePaise: number;
}

interface ShapedPannaRequest {
  game: 'sp' | 'dp' | 'tp';
  side: SessionSide;
  panna: string;
  stakePaise: number;
}

interface ShapedPannaBulkRequest {
  game: 'spBulk' | 'dpBulk' | 'tpBulk';
  side: SessionSide;
  pannas: readonly string[];
  stakePaise: number;
}

interface SdDpTpRequest {
  game: 'sdDpTp';
  side: SessionSide;
  ank: number;
  stakePaise: number;
}

interface MotorRequest {
  game: 'spMotor' | 'dpMotor';
  side: SessionSide;
  digits: readonly number[];
  stakePaise: number;
}

interface RedJodiRequest {
  game: 'redJodi';
  stakePaise: number;
  jodis?: readonly string[];
}

interface PannaFamilyRequest {
  game: 'pannaFamily';
  side: SessionSide;
  panna: string;
  stakePaise: number;
}

interface CycleRequest {
  game: 'cyclePatti';
  side: SessionSide;
  first: number;
  second: number;
  stakePaise: number;
}

interface JodiFamilyRequest {
  game: 'jodiFamily';
  jodi: string;
  stakePaise: number;
}

interface HalfSangamRequest {
  game: 'halfSangam';
  variant: HalfSangamVariant;
  panna: string;
  ank: number;
  stakePaise: number;
}

interface FullSangamRequest {
  game: 'fullSangam';
  openPanna: string;
  closePanna: string;
  stakePaise: number;
}

export type BetRequest =
  | SingleRequest
  | SingleBulkRequest
  | JodiRequest
  | JodiBulkRequest
  | ShapedPannaRequest
  | ShapedPannaBulkRequest
  | SdDpTpRequest
  | MotorRequest
  | RedJodiRequest
  | PannaFamilyRequest
  | CycleRequest
  | JodiFamilyRequest
  | HalfSangamRequest
  | FullSangamRequest;

export interface PricedSlip {
  slip: Slip;
  stakePaise: number;
  rateKey: RateKey;
  lockedRate: Rate;
}

export interface AcceptedBet {
  slips: readonly PricedSlip[];
  totalStakePaise: number;
}

function hasOpenSide(request: BetRequest): boolean {
  return 'side' in request && request.side === 'open';
}

function assertPhaseAllows(phase: BettingPhase, request: BetRequest): void {
  if (phase === 'cancelled') {
    throw new MatkaRulesError('This market is not taking bets.');
  }
  if (phase === 'closed') {
    throw new MatkaRulesError('Betting is closed for this market.');
  }
  if (phase === 'preOpen') {
    return;
  }
  if (hasOpenSide(request)) {
    throw new MatkaRulesError('Open-side bets are closed.');
  }
  if (request.game === 'halfSangam' || request.game === 'fullSangam') {
    throw new MatkaRulesError('Sangam bets close at the open cutoff.');
  }
}

function normalizeList(pannas: readonly string[]): string[] {
  return pannas.map((panna) => normalizePanna(panna));
}

function expandRequest(request: BetRequest): readonly Slip[] {
  const stake = request.stakePaise;
  switch (request.game) {
    case 'single':
      assertSide(request.side);
      return [createSingleSlip(request.side, request.ank, stake)];
    case 'singleBulk':
      assertSide(request.side);
      return expandSingleBulk(request.side, request.anks, stake).slips;
    case 'jodi':
      return [createJodiSlip(request.jodi, stake)];
    case 'jodiBulk':
      return expandJodiBulk(request.jodis, stake).slips;
    case 'sp':
    case 'dp':
    case 'tp':
      assertSide(request.side);
      return [createPannaSlip(request.side, normalizePanna(request.panna), stake, request.game)];
    case 'spBulk':
    case 'dpBulk':
    case 'tpBulk':
      assertSide(request.side);
      return expandPannaBulk(
        request.side,
        normalizeList(request.pannas),
        request.game === 'spBulk' ? 'sp' : request.game === 'dpBulk' ? 'dp' : 'tp',
        stake,
      ).slips;
    case 'sdDpTp':
      assertSide(request.side);
      return expandSdDpTp(request.side, request.ank, stake).slips;
    case 'spMotor':
      assertSide(request.side);
      return expandSpMotor(request.side, request.digits, stake).slips;
    case 'dpMotor':
      assertSide(request.side);
      return expandDpMotor(request.side, request.digits, stake).slips;
    case 'redJodi':
      return expandRedJodi(stake, request.jodis).slips;
    case 'pannaFamily':
      assertSide(request.side);
      return expandPannaFamily(request.side, normalizePanna(request.panna), stake).slips;
    case 'cyclePatti':
      assertSide(request.side);
      return expandCyclePatti(request.side, request.first, request.second, stake).slips;
    case 'jodiFamily':
      return expandJodiFamily(request.jodi, stake).slips;
    case 'halfSangam':
      return [
        createHalfSangamSlip(request.variant, normalizePanna(request.panna), request.ank, stake),
      ];
    case 'fullSangam':
      return [
        createFullSangamSlip(
          normalizePanna(request.openPanna),
          normalizePanna(request.closePanna),
          stake,
        ),
      ];
    default: {
      const unexpected: never = request;
      return unexpected;
    }
  }
}

function priceSlips(slips: readonly Slip[], card: RateCard): PricedSlip[] {
  return slips.map((slip) => {
    const rateKey = rateKeyForSlip(slip);
    return {
      slip,
      stakePaise: slip.stake,
      rateKey,
      lockedRate: rateFor(card, rateKey),
    };
  });
}

export function acceptBet(
  phase: BettingPhase,
  request: BetRequest,
  rateCard: RateCard,
  limits: StakeLimits,
): AcceptedBet {
  assertPhaseAllows(phase, request);
  assertStakePaise(request.stakePaise, limits);
  const slips = expandRequest(request);
  const priced = priceSlips(slips, rateCard);
  const totalStakePaise = priced.reduce((total, slip) => total + slip.stakePaise, 0);
  return { slips: priced, totalStakePaise };
}
