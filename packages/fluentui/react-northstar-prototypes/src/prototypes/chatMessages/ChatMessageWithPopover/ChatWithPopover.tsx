import {
  Chat,
  Provider,
  Avatar,
  ChatMessageProps,
  ShorthandCollection,
  ReactionProps,
} from '@fluentui/react-northstar';
import * as React from 'react';
import Popover from './Popover';
import ReactionPopup from './ReactionPopup';
import { Ref } from '@fluentui/react-component-ref';
import { AcceptIcon, EmojiIcon, LikeIcon } from '@fluentui/react-icons-northstar';

const reactions: ShorthandCollection<ReactionProps> = [
  // @ts-expect-error React 18 TODO
  {
    icon: <LikeIcon />,
    content: '1K',
    key: 'likes',
    variables: { meReacting: true },
    children: (Component, props) => <ReactionPopup {...props} />,
  },
  // @ts-expect-error React 18 TODO
  {
    icon: <EmojiIcon />,
    content: 2,
    key: 'smiles',
    children: (Component, props) => <ReactionPopup {...props} />,
  },
];

const robinAvatar = {
  image: 'public/images/avatar/RobinCounts.jpg',
  status: { color: 'green', icon: <AcceptIcon /> },
};

const ChatWithPopover = () => {
  return (
    <Provider
      theme={{
        componentStyles: {
          ChatMessage: {
            root: ({ props: p, theme: { siteVariables } }) => ({
              '& a': {
                color: siteVariables.colors.brand[600],
              },
            }),
          },
          Menu: {
            root: {
              background: '#fff',
              transition: 'opacity 0.2s',
              position: 'absolute',

              '& a:focus': {
                textDecoration: 'none',
                color: 'inherit',
              },
              '& a': {
                color: 'inherit',
              },

              '& .smile-emoji': {
                position: 'absolute',
                opacity: 0,
                zIndex: -1,
              },

              '&.focused .smile-emoji': {
                position: 'initial',
                zIndex: 'initial',
                opacity: 1,
              },

              '&:hover .smile-emoji': {
                position: 'initial',
                zIndex: 'initial',
                opacity: 1,
              },
            },
          },
        },
      }}
    >
      <Chat
        items={[
          {
            key: 'a',
            message: (
              <TeamsChatMessage
                author="Robin Counts"
                content={
                  <div>
                    <a href="/">Link</a> Hover me to see the actions <a href="/">Some Link</a>
                  </div>
                }
                reactionGroup={{
                  items: reactions,
                }}
                timestamp="Yesterday, 10:15 PM"
              />
            ),
            gutter: <Avatar {...robinAvatar} />,
          },
          {
            key: 'b',
            message: (
              <TeamsChatMessage
                author="Robin Counts"
                content={
                  <div>
                    <a href="/">Link</a> Hover me to see the actions <a href="/">Some Link</a>
                  </div>
                }
                reactionGroup={{
                  items: reactions,
                }}
                timestamp="Yesterday, 10:15 PM"
              />
            ),
            gutter: <Avatar {...robinAvatar} />,
          },
        ]}
      />
    </Provider>
  );
};

const TeamsChatMessage: React.FC<React.PropsWithChildren<ChatMessageProps>> = (props: ChatMessageProps) => {
  const [showActionMenu, setShowActionMenu] = React.useState(false);
  const [forceShowActionMenu, setForceShowActionMenu] = React.useState(false);
  const [chatMessageElement, setChatMessageElement] = React.useState<HTMLElement>(null);

  const handleBlur = e => !e.currentTarget.contains(e.relatedTarget) && setShowActionMenu(false);

  return (
    <Ref innerRef={setChatMessageElement}>
      <Chat.Message
        {...props}
        // @ts-expect-error React 18 TODO
        actionMenu={{
          children: (Component, props) => (
            <Popover
              chatMessageElement={chatMessageElement}
              onForceShowActionMenuChange={setForceShowActionMenu}
              onShowActionMenuChange={setShowActionMenu}
              {...props}
            />
          ),
        }}
        onMouseEnter={() => setShowActionMenu(true)}
        onMouseLeave={() => !forceShowActionMenu && setShowActionMenu(false)}
        onFocus={() => setShowActionMenu(true)}
        onBlur={handleBlur}
        variables={{ showActionMenu }}
      />
    </Ref>
  );
};

export default ChatWithPopover;
