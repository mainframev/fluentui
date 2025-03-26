import * as React from 'react';
import { Image, ImageProps } from '@fluentui/react-northstar';

export type LogoProps = ImageProps & {
  flavor?: 'black' | 'white' | 'inverted';
};

const Logo: React.FC<React.PropsWithChildren<LogoProps>> = ({ flavor, ...props }) => (
  <Image
    {...props}
    src={`https://fabricweb.azureedge.net/fabric-website/assets/images/fluent-ui-logo${flavor ? `-${flavor}` : ''}.png`}
  />
);

export default Logo;
