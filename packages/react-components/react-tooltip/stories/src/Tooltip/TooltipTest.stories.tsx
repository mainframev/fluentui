import * as React from 'react';
import { MenuButton, Menu, MenuTrigger, MenuList, MenuItem, MenuPopover, Tooltip } from '@fluentui/react-components';
import {
  bundleIcon,
  ClipboardPasteRegular,
  ClipboardPasteFilled,
  CutRegular,
  CutFilled,
  CopyRegular,
  CopyFilled,
} from '@fluentui/react-icons';
import type { MenuProps } from '@fluentui/react-components';

const PasteIcon = bundleIcon(ClipboardPasteFilled, ClipboardPasteRegular);
const CopyIcon = bundleIcon(CopyFilled, CopyRegular);
const CutIcon = bundleIcon(CutFilled, CutRegular);

export const Test = (props: Partial<MenuProps>) => {
  return (
    <React.StrictMode>
      <Menu {...props}>
        <MenuTrigger disableButtonEnhancement>
          <MenuButton>Edit content</MenuButton>
        </MenuTrigger>

        <MenuPopover>
          <MenuList>
            <Tooltip content="Cut to clipboard" relationship="description">
              <MenuItem icon={<CutIcon />} onClick={() => alert('Cut to clipboard')}>
                Cut
              </MenuItem>
            </Tooltip>
            <Tooltip content="Copy to clipboard" relationship="description">
              <MenuItem icon={<CopyIcon />} onClick={() => alert('Copied to clipboard')}>
                Copy
              </MenuItem>
            </Tooltip>
            <Tooltip content="Paste from clipboard" relationship="description">
              <MenuItem icon={<PasteIcon />} onClick={() => alert('Pasted from clipboard')}>
                Paste
              </MenuItem>
            </Tooltip>
          </MenuList>
        </MenuPopover>
      </Menu>
    </React.StrictMode>
  );
};
