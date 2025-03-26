import * as React from 'react';
import ExampleSection, { ExampleSectionProps } from './ExampleSection';

const NonPublicSection: React.FC<React.PropsWithChildren<ExampleSectionProps>> = props => {
  return process.env.NODE_ENV === 'development' ? <ExampleSection {...props} /> : null;
};

export default NonPublicSection;
