import * as React from 'react';
import { mount as mountBase } from '@fluentui/scripts-cypress';
import {
  Menu,
  MenuItem,
  MenuButton,
  MenuList,
  MenuTrigger,
  MenuPopover,
  Button,
  Tooltip,
  tooltipClassNames,
} from '@fluentui/react-components';
import { SlideTextRegular } from '@fluentui/react-icons';
import { Provider } from '../Provider/Provider';
import type { JSXElement } from '@fluentui/react-utilities';

const mount = (element: JSXElement) => {
  mountBase(<Provider>{element}</Provider>);
};

describe('Tooltip with React 19', () => {
  it('should render a Tooltip', () => {
    const content = 'Example tooltip';
    mount(
      <Tooltip content={content} relationship="label">
        <Button icon={<SlideTextRegular />} size="large" />
      </Tooltip>,
    );

    cy.get('button').focus();
    cy.get(`.${tooltipClassNames.content}`).should('be.visible').and('contain.text', content);
  });

  // https://github.com/microsoft/fluentui/issues/34296
  it('should show tooltip inside a Menu when opened by keyboard', () => {
    mount(
      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <MenuButton>Edit content</MenuButton>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <Tooltip showDelay={0} content="Cut to clipboard" relationship="description">
              <MenuItem>Menu Item</MenuItem>
            </Tooltip>
          </MenuList>
        </MenuPopover>
      </Menu>,
    );

    cy.realPress('Tab');
    cy.get('button').focus().realPress('Enter');
    cy.get('[role="menuitem"]').should('be.focused');
    cy.get(`.${tooltipClassNames.content}`).should('be.visible');
  });
});
