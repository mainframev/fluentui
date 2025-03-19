import * as React from 'react';
import { CalendarDayBase } from './CalendarDay.base';
import { styles } from './CalendarDay.styles';
import { styled } from '../../../Utilities';
import type { ICalendarDayProps } from './CalendarDay.types';

export const CalendarDay: React.FunctionComponent<React.PropsWithChildren<ICalendarDayProps>> = styled(CalendarDayBase, styles, undefined, {
  scope: 'CalendarDay',
});
