import React, { useState } from 'react';

import { demoTokenContract } from '@common/contracts';
import { useSTXAddress } from '@common/use-stx-address';
import {
  stacksTestnetNetwork as network,
  stacksLocalhostNetwork,
  stacksMainnetNetwork,
  stacksTestnetNetwork,
} from '@common/utils';
import { useConnect } from '@stacks/connect-react';
import { StacksMainnet, StacksTestnet } from '@stacks/network';
import {
  FungibleConditionCode,
  NonFungibleConditionCode,
  PostConditionMode,
  StacksTransaction,
  broadcastTransaction,
  bufferCV,
  bufferCVFromString,
  createAssetInfo,
  createNonFungiblePostCondition,
  intCV,
  makeStandardFungiblePostCondition,
  makeStandardSTXPostCondition,
  noneCV,
  someCV,
  sponsorTransaction,
  standardPrincipalCV,
  stringAsciiCV,
  stringUtf8CV,
  trueCV,
  tupleCV,
  uintCV,
} from '@stacks/transactions';
import { TestAppSelectors } from '@tests/selectors/test-app.selectors';
import BN from 'bn.js';
import { Box, Flex, styled } from 'leather-styles/jsx';

import { ExplorerLink } from './explorer-link';

export const Debugger = () => {
  const { doContractCall, doSTXTransfer, doContractDeploy } = useConnect();
  const address = useSTXAddress();

  const [txId, setTxId] = useState<string>('');
  const [txType, setTxType] = useState<string>('');

  const clearState = () => {
    setTxId('');
    setTxType('');
  };

  const setState = (type: string, id: string) => {
    setTxId(id);
    setTxType(type);
  };

  // If need to add more test tokens: STW7PFH79HW1C9Z0SXBP5PTPHKZZ58KK9WP1MZZA
  const handleSponsoredTransactionBroadcast = async (tx: StacksTransaction) => {
    const sponsorOptions = {
      fee: new BN(388),
      sponsorPrivateKey: 'b8c6aaef4b6de5e62648a59fff13e389856dff5e58163e676c2cfdf9dd5dd11101',
      transaction: tx,
    };

    const sponsoredTx = await sponsorTransaction(sponsorOptions);
    return broadcastTransaction(sponsoredTx, network);
  };

  const callBnsTransfer = async () => {
    // this will fail because the address does not own the name
    clearState();
    const args = [
      bufferCVFromString('id'), // namespace
      bufferCVFromString('stella'), // name
      standardPrincipalCV('ST1X6M947Z7E58CNE0H8YJVJTVKS9VW0PHEG3NHN3'), // recipient
      noneCV(), // zonefile
    ];
    await doContractCall({
      network,
      contractAddress: 'ST000000000000000000002AMW42H',
      contractName: 'bns',
      functionName: 'name-transfer',
      functionArgs: args,
      attachment: 'This is an attachment',
      postConditions: [
        createNonFungiblePostCondition(
          address || '', // the sender
          NonFungibleConditionCode.Sends, // will not own this NFT anymore
          createAssetInfo('ST000000000000000000002AMW42H', 'bns', 'names'), // bns NFT
          tupleCV({
            name: bufferCVFromString('stella'),
            namespace: bufferCVFromString('id'),
          }) // the name
        ),
      ],
      onFinish: data => {
        console.log('finished bns call!', data);
        setState('Contract Call', data.txId);
      },
    });
  };

  const callAnimalTransfer = async () => {
    clearState();
    const args = [
      uintCV(1),
      standardPrincipalCV('ST3K6AFDAW05G6Z9FWZD61RBRN6WV1J2N4MJG43JJ'), // sender
      standardPrincipalCV('ST9VQ21ZEGG54JDFE39B99ZBTSFSWMEC323MENFG'), // recipient
    ];
    await doContractCall({
      network,
      contractAddress: 'ST9VQ21ZEGG54JDFE39B99ZBTSFSWMEC323MENFG',
      contractName: 'animal',
      functionName: 'transfer',
      functionArgs: args,
      postConditionMode: PostConditionMode.Allow,
      postConditions: [],
      onFinish: data => {
        console.log('finished nft transfer!', data);
        setState('Contract Call', data.txId);
      },
    });
  };

  const callFaker = async (
    network: StacksTestnet,
    mode = PostConditionMode.Deny,
    sponsored = false
  ) => {
    clearState();
    const contractAddress = network.isMainnet()
      ? 'SPY0682ZM7VGPMVGQP99Z05J3QWMVV83RA6N42SA'
      : 'STS8CKF63P16J28AYF7PXW9E5AACH0NZNRV74CM7';

    const args = [
      uintCV(1234),
      intCV(-234),
      bufferCV(Buffer.from('hello, world')),
      stringAsciiCV('hey-ascii'),
      stringUtf8CV('hey-utf8'),
      standardPrincipalCV(contractAddress),
      trueCV(),
    ];
    const postConditions = [
      makeStandardSTXPostCondition(
        address || '',
        FungibleConditionCode.LessEqual,
        new BN('100', 10)
      ),
    ];
    console.log('creating allow mode contract call');
    await doContractCall({
      network,
      contractAddress,
      contractName: 'faker',
      functionName: 'rawr',
      functionArgs: args,
      attachment: 'This is an attachment',
      postConditionMode: mode,
      postConditions,
      onFinish: async (data: any) => {
        console.log('finished faker!', data);
        if (sponsored) handleSponsoredTransactionBroadcast(data.stacksTransaction);
        setState('Contract Call', data.txId);
      },
      onCancel: () => {
        console.log('popup closed!');
      },
      sponsored,
    });
  };

  const stxTransfer = async (amount: string) => {
    clearState();
    await doSTXTransfer({
      network,
      amount,
      memo: 'From demo app',
      recipient: 'ST1X6M947Z7E58CNE0H8YJVJTVKS9VW0PHEG3NHN3',
      onFinish: data => {
        console.log('finished stx transfer!', data);
        setState('Stacks Transfer', data?.txId);
      },
      onCancel: () => {
        console.log('popup closed!');
      },
    });
  };

  const deployContract = async () => {
    clearState();
    await doContractDeploy({
      network,
      contractName: `demo-deploy-${new Date().getTime().toString()}`,
      codeBody: demoTokenContract,
      onFinish: data => {
        console.log('finished stx transfer!', data);
        setState('Contract Deploy', data.txId);
      },
      onCancel: () => {
        console.log('popup closed!');
      },
    });
  };

  const callNullContract = async () => {
    clearState();
    await doContractCall({
      network,
      contractAddress: 'ST1X6M947Z7E58CNE0H8YJVJTVKS9VW0PHEG3NHN3',
      contractName: `connect-token-${new Date().getTime()}`,
      functionName: 'faucet',
      functionArgs: [],
    });
  };

  const getRocketTokens = async () => {
    clearState();
    await doContractCall({
      network,
      contractAddress: 'ST1X6M947Z7E58CNE0H8YJVJTVKS9VW0PHEG3NHN3',
      contractName: 'dull-sapphire-bird',
      functionName: 'buy',
      functionArgs: [uintCV(42)],
      postConditions: [
        makeStandardSTXPostCondition(address || '', FungibleConditionCode.Equal, new BN(42, 10)),
      ],
      onFinish: data => {
        console.log('finished faucet!', data);
        setState('Token Faucet', data.txId);
      },
      onCancel: () => {
        console.log('popup closed!');
      },
    });
  };

  const getStellaFaucetTokens = async () => {
    clearState();
    await doContractCall({
      network,
      contractAddress: 'ST6G7N19FKNW24XH5JQ5P5WR1DN10QWMKQSPSTK7',
      contractName: 'stella-the-cat',
      functionName: 'faucet',
      functionArgs: [],
      onFinish: data => {
        console.log('finished faucet!', data);
        setState('Token Faucet', data.txId);
      },
      onCancel: () => {
        console.log('popup closed!');
      },
    });
  };

  const sendStellaTokens = async () => {
    clearState();
    await doContractCall({
      network,
      contractAddress: 'ST6G7N19FKNW24XH5JQ5P5WR1DN10QWMKQSPSTK7',
      contractName: 'stella-the-cat',
      functionName: 'transfer',
      functionArgs: [
        uintCV(1), // amount
        standardPrincipalCV(address || ''), // sender
        standardPrincipalCV('ST1X6M947Z7E58CNE0H8YJVJTVKS9VW0PHEG3NHN3'), // recipient
        someCV(bufferCVFromString('meow')), // memo
      ],
      postConditions: [
        makeStandardFungiblePostCondition(
          address || '',
          FungibleConditionCode.Equal,
          new BN(1),
          createAssetInfo(
            'ST6G7N19FKNW24XH5JQ5P5WR1DN10QWMKQSPSTK7',
            'stella-the-cat',
            'stella-token'
          )
        ),
      ],
      onFinish: data => {
        console.log('finished faucet!', data);
        setState('Token Faucet', data.txId);
      },
      onCancel: () => {
        console.log('popup closed!');
      },
    });
  };

  const sendRocketTokens = async () => {
    clearState();
    await doContractCall({
      network,
      contractAddress: 'ST1X6M947Z7E58CNE0H8YJVJTVKS9VW0PHEG3NHN3',
      contractName: 'dull-sapphire-bird',
      functionName: 'transfer',
      functionArgs: [
        uintCV(1), // amount
        standardPrincipalCV(address || ''), // sender
        standardPrincipalCV('ST1X6M947Z7E58CNE0H8YJVJTVKS9VW0PHEG3NHN3'), // recipient
      ],
      postConditions: [
        makeStandardFungiblePostCondition(
          address || '',
          FungibleConditionCode.Equal,
          new BN(1),
          createAssetInfo(
            'ST1X6M947Z7E58CNE0H8YJVJTVKS9VW0PHEG3NHN3',
            'dull-sapphire-bird',
            'rocket-token'
          )
        ),
      ],
      onFinish: data => {
        console.log('finished faucet!', data);
        setState('Token Faucet', data.txId);
      },
      onCancel: () => {
        console.log('popup closed!');
      },
    });
  };

  const sendMiamiTokens = async () => {
    clearState();
    await doContractCall({
      network: new StacksMainnet(),
      contractAddress: 'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27',
      contractName: 'miamicoin-token',
      functionName: 'transfer',
      functionArgs: [
        uintCV(1), // amount
        standardPrincipalCV(address || ''), // sender
        standardPrincipalCV('ST1X6M947Z7E58CNE0H8YJVJTVKS9VW0PHEG3NHN3'), // recipient
      ],
      postConditions: [
        makeStandardFungiblePostCondition(
          address || '',
          FungibleConditionCode.Equal,
          new BN(1),
          createAssetInfo(
            'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27',
            'miamicoin-token',
            'miami-token'
          )
        ),
      ],
      onFinish: data => {
        setState('Token Faucet', data.txId);
      },
      onCancel: () => {
        console.log('popup closed!');
      },
    });
  };
  return (
    <Box py={6}>
      <styled.h2>Debugger</styled.h2>
      <styled.span>
        Try out a bunch of different transactions on the Stacks blockchain testnet.
      </styled.span>
      {txId && (
        <styled.span>
          <styled.span color="green" textStyle="body.02" data-testid="status-message">
            Successfully broadcasted &quot;{txType}&quot;
          </styled.span>
          <ExplorerLink txId={txId} />
        </styled.span>
      )}

      <Box>
        <Flex gap={4} my="space.04">
          <styled.button
            mt={3}
            onClick={() => callFaker(stacksTestnetNetwork, PostConditionMode.Allow)}
          >
            Contract call (ALLOW mode)
          </styled.button>
          <styled.button mt={3} onClick={() => callFaker(stacksTestnetNetwork)}>
            Contract call (Testnet)
          </styled.button>
          <styled.button
            data-testid={TestAppSelectors.BtnContractCall}
            mt={3}
            onClick={() => callFaker(stacksMainnetNetwork)}
          >
            Contract call (StacksMainnet)
          </styled.button>
          <styled.button mt={3} onClick={() => callFaker(stacksLocalhostNetwork)}>
            Contract call (Localhost)
          </styled.button>
          <styled.button
            data-testid={TestAppSelectors.BtnStxTransfer}
            mt={3}
            onClick={() => stxTransfer('102')}
          >
            STX transfer
          </styled.button>
          <styled.button mt={3} onClick={callBnsTransfer}>
            NFT with postconditions (will fail)
          </styled.button>
          <styled.button mt={3} onClick={callAnimalTransfer}>
            transfer Animal NFT
          </styled.button>
          <styled.button mt={3} onClick={deployContract}>
            Contract deploy
          </styled.button>
          <styled.button mt={3} onClick={getStellaFaucetTokens}>
            Get SteLLa tokens (sip 10 with memo)
          </styled.button>
          <styled.button mt={3} onClick={sendStellaTokens}>
            Send SteLLa tokens
          </styled.button>
          <styled.button mt={3} onClick={getRocketTokens}>
            Get Rocket tokens (old sip 10 no memo)
          </styled.button>
          <styled.button mt={3} onClick={sendRocketTokens}>
            Send Rocket tokens
          </styled.button>
          <styled.button mt={3} onClick={sendMiamiTokens}>
            Send Miami tokens
          </styled.button>
          <styled.button mt={3} onClick={callNullContract}>
            Non-existent contract
          </styled.button>
          <styled.button
            mt={3}
            onClick={() => callFaker(stacksTestnetNetwork, PostConditionMode.Allow, true)}
          >
            Sponsored contract call
          </styled.button>
          <styled.button
            mt={3}
            onClick={() =>
              fetch('https://api.hiro.so/v2/info')
                .then(resp => resp.json())
                .then(console.log)
            }
          >
            Request API info
          </styled.button>

          <styled.button
            mt={3}
            onClick={() => {
              console.log('requesting');
              window.LeatherProvider?.request('getAddresses')
                .then(resp => {
                  console.log({ sucesss: resp });
                })
                .catch(error => {
                  console.log({ error });
                });
            }}
          >
            RPC test
          </styled.button>
        </Flex>
      </Box>
    </Box>
  );
};
