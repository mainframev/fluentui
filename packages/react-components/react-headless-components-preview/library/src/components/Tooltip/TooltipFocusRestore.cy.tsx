import * as React from 'react';
import { mount as mountBase } from '@fluentui/scripts-cypress';
import { Popover, PopoverSurface, PopoverTrigger } from '../Popover';
import { Tooltip } from './Tooltip';
import type { JSXElement } from '@fluentui/react-utilities';

const mount = (element: JSXElement) => mountBase(element);

const tooltipSelector = '[role="tooltip"]';

// Regression coverage for https://github.com/microsoft/fluentui/issues/27576:
// when focus returns to the trigger after the popover closes, the tooltip must not show for pointer interactions.
const Example = () => {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Popover open={open} onOpenChange={(_, data) => setOpen(data.open)}>
        <Tooltip relationship="description" content="Tooltip content" showDelay={0} hideDelay={0}>
          <PopoverTrigger disableButtonEnhancement>
            <button data-testid="trigger">Trigger</button>
          </PopoverTrigger>
        </Tooltip>
        <PopoverSurface data-testid="surface">
          <button data-testid="close" onClick={() => setOpen(false)}>
            Close
          </button>
        </PopoverSurface>
      </Popover>
    </>
  );
};

describe('Tooltip focus restore after popover close', () => {
  it('does not show the tooltip when focus returns after a mouse close', () => {
    mount(<Example />);
    cy.get('[data-testid="trigger"]').click({ force: true });
    cy.get('[data-testid="surface"]').should('be.visible');
    cy.get('[data-testid="close"]').realClick();
    cy.get('[data-testid="surface"]').should('not.exist');
    cy.get('[data-testid="trigger"]').should('have.focus');
    cy.get(tooltipSelector).should('not.be.visible');
  });

  it('shows the tooltip when focus returns after a keyboard close', () => {
    mount(<Example />);
    cy.get('[data-testid="trigger"]').focus().realPress('Enter');
    cy.get('[data-testid="surface"]').should('be.visible');
    cy.focused().realPress('Escape');
    cy.get('[data-testid="surface"]').should('not.exist');
    cy.get('[data-testid="trigger"]').should('have.focus');
    cy.get(tooltipSelector).should('be.visible');
  });
});
