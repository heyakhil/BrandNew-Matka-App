export const QUICK_ADD_AMOUNTS: number[] = [
  ...(__DEV__ ? [1] : []),
  110,
  200,
  300,
  500,
  1000,
  1500,
  2000,
];

export const MIN_DEPOSIT_RUPEES = 100;
export const MIN_WITHDRAW_RUPEES = 500;
export const MAX_WITHDRAW_RUPEES = 50000;

export const WITHDRAW_TERMS: string[] = [
  'Minimum Withdraw is 500/- Rs.',
  'Maximum Withdraw Is 50,000/- Rs.',
  'Above 50k You Should Request Us Manually.',
  'Withdraw Request Timing is 09:00 AM to 11:59 PM.',
  'Process Time is 12-24 Hours',
  'Withdraw Is Available On All Days Except National Holidays',
];
