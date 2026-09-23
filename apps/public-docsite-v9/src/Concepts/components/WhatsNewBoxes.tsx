import * as React from 'react';
import { Text, webLightTheme } from '@fluentui/react-components';
import { useWhatsNewStyles } from './WhatsNewBoxes.styles';

type Box = {
  image: 'string';
  text: 'string';
};

interface WhatsNewBoxProps {
  boxes: Box[];
}

export const WhatsNewBoxes: React.FC<WhatsNewBoxProps> = props => {
  const styles = useWhatsNewStyles();

  return (
    <div>
      <h2
        style={{
          fontFamily: 'inherit',
          fontSize: webLightTheme.fontSizeBase600,
          lineHeight: webLightTheme.lineHeightBase600,
          fontWeight: webLightTheme.fontWeightBold,
          color: 'inherit',
          marginBlock: `0 ${webLightTheme.spacingVerticalXXL}`,
          textWrap: 'balance',
        }}
      >
        What's new
      </h2>
      <div className={styles.wrapper}>
        {props.boxes.map((box, i) => (
          <WhatsNewBox key={i} {...box} />
        ))}
      </div>
    </div>
  );
};

const WhatsNewBox: React.FC<Box> = props => {
  const styles = useWhatsNewStyles();

  return (
    <div className={styles.whatsNew}>
      <div className={styles.box}>
        <img className={styles.image} role="presentation" src={props.image} />
      </div>
      <Text>{props.text}</Text>
    </div>
  );
};
