import * as React from 'react';

export const DOMFunction: React.FunctionComponent<React.PropsWithChildren<unknown>> = props => <div {...props} id="node" />;

export const CompositeFunction: React.FunctionComponent<React.PropsWithChildren<unknown>> = props => <DOMFunction {...props} />;

export class DOMClass extends React.Component {
  render() {
    return <div {...this.props} id="node" />;
  }
}

export class CompositeClass extends React.Component {
  render() {
    return <DOMClass {...this.props} />;
  }
}

export const ForwardedRef = React.forwardRef<HTMLButtonElement>((props, ref) => (
  <div>
    <button {...props} ref={ref} />
  </div>
));
