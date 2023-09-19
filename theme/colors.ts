import { defineTokens } from '@pandacss/dev';

export const colors = defineTokens.colors({
  current: { value: 'currentColor' },
  dark: { value: '#111' },
  black: { value: '#000' },
  white: { value: '#fff' },
  red: {
    100: { value: '#FCEEED' },
    300: { value: '#FFABB1' },
    500: { value: '#FF5863' },
    600: { value: '#FF2E3C' },
  },
  blue: {
    100: { value: '#E6F2FF' },
    300: { value: '#9BCAFF' },
    500: { value: '#3795FF' },
    600: { value: '#057AFF' },
  },
  yellow: {
    100: { value: '#FEF9E6' },
    300: { value: '#FBE699' },
    500: { value: '#F7CD33' },
    600: { value: '#F5C000' },
  },
  green: {
    100: { value: '#E6F5ED' },
    300: { value: '#99D8B9' },
    500: { value: '#33B172' },
    600: { value: '#009E4F' },
  },
  lightModeBrown: {
    1: { value: '#FFFFFF' },
    2: { value: '#F5F1ED' },
    3: { value: '#EAE5E0' },
    4: { value: '#E4DDD6' },
    5: { value: '#DED6CD' },
    6: { value: '#D8CEC4' },
    7: { value: '#C6B9AD' },
    8: { value: '#948677' },
    9: { value: '#12100F' },
    10: { value: '#4A423B' },
    11: { value: '#4A423B' },
    12: { value: '#12100F' },
  },
  darkModeBrown: {
    1: { value: '#12100F' },
    2: { value: '#2C2A24' },
    3: { value: '#4A423B' },
    4: { value: '#34312A' },
    5: { value: '#12100F' },
    6: { value: '#716A60' },
    7: { value: '#8F887D' },
    8: { value: '#C6B9AD' },
    9: { value: '#F5F1ED' },
    10: { value: '#DED6CD' },
    11: { value: '#DED6CD' },
    12: { value: '#F5F1ED' },
  },
  lightModeInk: {
    1: { value: '#FFFFFF' },
    2: { value: '#F9F9F9' },
    3: { value: '#F1F1F1' },
    4: { value: '#EBEBEB' },
    5: { value: '#E4E4E4' },
    6: { value: '#DDDDDD' },
    7: { value: '#D4D4D4' },
    8: { value: '#BBBBBB' },
    9: { value: '#8D8D8D' },
    10: { value: '#808080' },
    11: { value: '#646464' },
    12: { value: '#12100F' },
  },
  darkModeInk: {
    1: { value: '#12100F' },
    2: { value: '#1B1B1B' },
    3: { value: '#282828' },
    4: { value: '#303030' },
    5: { value: '#373737' },
    6: { value: '#3F3F3F' },
    7: { value: '#4A4A4A' },
    8: { value: '#606060' },
    9: { value: '#6E6E6E' },
    10: { value: '#818181' },
    11: { value: '#B1B1B1' },
    12: { value: '#EEEEEE' },
  },
});
