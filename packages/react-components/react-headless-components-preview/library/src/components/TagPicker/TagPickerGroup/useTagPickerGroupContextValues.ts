'use client';

import { useTagGroupContextValues_unstable } from '@fluentui/react-tags';

import type { TagGroupContextValues } from '../../TagGroup/TagGroup.types';
import type { TagPickerGroupState } from './TagPickerGroup.types';

export const useTagPickerGroupContextValues = useTagGroupContextValues_unstable as (
  state: TagPickerGroupState,
) => TagGroupContextValues;
