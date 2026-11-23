import type { BetRequest } from '../../../packages/matka-rules/src/index';
import type { SubmittedBidItem } from '../screens/PlayGameScreen';

export function toBetRequest(item: SubmittedBidItem): BetRequest {
  const stakePaise = item.stakeRupees * 100;
  if (!Number.isSafeInteger(stakePaise))
    throw new Error('Invalid stake amount.');
  const side = item.side === 'close' ? 'close' : 'open';
  switch (item.gameCode) {
    case 'SD':
    case 'SDB':
    case 'OE':
      return { game: 'single', side, ank: Number(item.number), stakePaise };
    case 'JD':
    case 'JDB':
      return { game: 'jodi', jodi: item.number, stakePaise };
    case 'SP':
    case 'SPB':
      return { game: 'sp', side, panna: item.number, stakePaise };
    case 'DP':
    case 'DPB':
      return { game: 'dp', side, panna: item.number, stakePaise };
    case 'TP':
      return { game: 'tp', side, panna: item.number, stakePaise };
    case 'SPM':
      return {
        game: 'spMotor',
        side,
        digits: item.number.split('').map(Number),
        stakePaise,
      };
    case 'DPM':
      return {
        game: 'dpMotor',
        side,
        digits: item.number.split('').map(Number),
        stakePaise,
      };
    case 'SDT':
      return { game: 'sdDpTp', side, ank: Number(item.number), stakePaise };
    case 'RB':
      return { game: 'redJodi', jodis: [item.number], stakePaise };
    case 'GJ':
      return { game: 'jodiFamily', jodi: item.number, stakePaise };
    case 'CP':
      return { game: 'pannaFamily', side, panna: item.number, stakePaise };
    case 'TDP': {
      const [first, second] = item.number.split('-').map(Number);
      return { game: 'cyclePatti', side, first, second, stakePaise };
    }
    case 'HS': {
      const [panna, ank] = item.number.split('-');
      return {
        game: 'halfSangam',
        variant: item.halfVariant ?? 'openPannaCloseAnk',
        panna,
        ank: Number(ank),
        stakePaise,
      };
    }
    case 'FS': {
      const [openPanna, closePanna] = item.number.split('-');
      return { game: 'fullSangam', openPanna, closePanna, stakePaise };
    }
    default:
      throw new Error('This game is not configured for live betting.');
  }
}

export function stakeForItem(item: SubmittedBidItem): number {
  const digits = item.number.replace(/\D/g, '');
  const n = digits.length;
  switch (item.gameCode) {
    case 'SPM':
      return (item.stakeRupees * n * (n - 1) * (n - 2)) / 6;
    case 'DPM':
      return item.stakeRupees * n * (n - 1);
    case 'SDT':
      return item.stakeRupees * 22;
    case 'TDP':
      return item.stakeRupees * 10;
    case 'GJ': {
      const [first, second] = digits.split('').map(Number);
      return (
        item.stakeRupees *
        (first === second || (first + 5) % 10 === second ? 4 : 8)
      );
    }
    case 'CP': {
      const panna = digits.split('').map(Number);
      const variants = new Set<string>();
      for (let mask = 0; mask < 8; mask++) {
        variants.add(
          panna
            .map((digit, index) =>
              mask & (1 << index) ? (digit + 5) % 10 : digit,
            )
            .sort((a, b) => (a || 10) - (b || 10))
            .join(''),
        );
      }
      return item.stakeRupees * variants.size;
    }
    default:
      return item.stakeRupees;
  }
}
