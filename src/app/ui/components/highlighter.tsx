import { memo } from 'react';

import { Box, Flex } from 'leather-styles/jsx';
import { Highlight } from 'prism-react-renderer';

import {
  GetGrammaticalTokenProps,
  GrammaticalToken,
  Language,
  RenderProps,
  theme,
} from '../utils/prism';
import { startPad } from '../utils/start-pad';

const lineNumberWidth = 60;
const getLineNumber = (n: number, length: number) => startPad(n + 1, length.toString().length);

function Tokens({
  tokens,
  getTokenProps,
  showLineNumbers,
  ...rest
}: {
  tokens: GrammaticalToken[];
  getTokenProps: GetGrammaticalTokenProps;
  showLineNumbers?: boolean;
}) {
  const pl = `calc(${showLineNumbers ? lineNumberWidth : '0'}px + 16px`;

  return (
    <Box pl={pl} pr="base" position="relative" zIndex={2} {...rest}>
      {tokens.map((token, i) => (
        <Box key={i} py="2px" display="inline-block" {...getTokenProps({ token, i })} />
      ))}
    </Box>
  );
}

function LineNumber({ number, length, ...rest }: { number: number; length: number }) {
  return (
    <Flex
      textAlign="right"
      pr="base"
      pl="base"
      width={lineNumberWidth}
      borderRight="1px solid"
      borderRightColor="inherit"
      color="ink.400"
      flexShrink={0}
      style={{ userSelect: 'none' }}
      position="absolute"
      left={0}
      height="100%"
      align="baseline"
      justify="center"
      zIndex={1}
      {...rest}
    >
      {getLineNumber(number, length)}
    </Flex>
  );
}

function Line({
  tokens,
  getTokenProps,
  index,
  length,
  showLineNumbers,
  hideLineHover,
  ...rest
}: {
  tokens: GrammaticalToken[];
  index: number;
  length: number;
  getTokenProps: GetGrammaticalTokenProps;
  showLineNumbers?: boolean;
  hideLineHover?: boolean;
}) {
  return (
    <Flex
      height="loose"
      align="baseline"
      borderColor="ink.900"
      _hover={
        hideLineHover
          ? undefined
          : { bg: ['unset', 'unset', 'ink.900'], borderColor: ['ink.900', 'ink.900', 'ink.600'] }
      }
      position="relative"
      {...rest}
    >
      {showLineNumbers ? <LineNumber number={index} length={length} /> : null}
      <Tokens showLineNumbers={showLineNumbers} getTokenProps={getTokenProps} tokens={tokens} />
    </Flex>
  );
}

function Lines({
  tokens: lines,
  getLineProps,
  getTokenProps,
  className,
  showLineNumbers,
  hideLineHover,
}: { showLineNumbers?: boolean; hideLineHover?: boolean } & RenderProps) {
  return (
    <Box display="block" className={className}>
      <Box display="block" style={{ fontFamily: 'Fira Code' }}>
        {lines.map((tokens: GrammaticalToken[], i: number) => (
          <Line
            index={i}
            key={i}
            tokens={tokens}
            getTokenProps={getTokenProps}
            length={lines.length + 1}
            showLineNumbers={showLineNumbers}
            hideLineHover={hideLineHover || lines.length < 3}
            {...getLineProps({ line: tokens, key: i })}
          />
        ))}
      </Box>
    </Box>
  );
}

interface PrismToken {
  type: string;
  content: (PrismToken | string)[] | string;
}

interface PrismGrammar {
  [key: string]: any;
}

type LanguageDict = { [lang in Language]: PrismGrammar };

interface PrismLib {
  languages: LanguageDict;
  tokenize: (code: string, grammar: PrismGrammar, language: Language) => PrismToken[] | string[];
  highlight: (code: string, grammar: PrismGrammar, language: Language) => string;
}

export interface HighlighterProps {
  code: string;
  language?: Language;
  showLineNumbers?: boolean;
  hideLineHover?: boolean;
  prism: PrismLib;
}

export const Highlighter = memo(
  ({ code, language = 'clarity', showLineNumbers, hideLineHover, prism }: HighlighterProps) => {
    return (
      <Highlight theme={theme} code={code} language={language} prism={prism as any}>
        {props => (
          <Lines showLineNumbers={showLineNumbers} hideLineHover={hideLineHover} {...props} />
        )}
      </Highlight>
    );
  }
);
