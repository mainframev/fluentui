import * as React from 'react';
import type { JSXElement } from '@fluentui/react-components';
import {
  useId,
  Link,
  Button,
  Toaster,
  useToastController,
  Toast,
  ToastTitle,
  ToastBody,
  ToastFooter,
  ToastLink,
  makeStyles,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  link: {
    color: 'red',
  },
});

export const InvertedAppearance = (): JSXElement => {
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);
  const styles = useStyles();
  const notify = () =>
    dispatchToast(
      <Toast appearance="inverted">
        <ToastTitle action={<ToastLink>Undo</ToastLink>}>Email sent</ToastTitle>
        <ToastBody subtitle="Subtitle">This is a toast body</ToastBody>
        <ToastFooter>
          {/* ToastLink automatically uses brand inverted color */}
          <ToastLink>Action 1</ToastLink>
          {/* ToastLink with custom className override */}
          <ToastLink className={styles.link}>Action 2 (Custom Red)</ToastLink>
          {/* Regular Link for comparison (uses neutral inverted color) */}
          <Link>Regular Link</Link>
        </ToastFooter>
      </Toast>,
      { intent: 'success' },
    );

  return (
    <>
      <Toaster toasterId={toasterId} timeout={50000} />
      <Button onClick={notify}>Make toast</Button>
    </>
  );
};
