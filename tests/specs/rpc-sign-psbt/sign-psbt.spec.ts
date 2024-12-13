import { BrowserContext, Page } from '@playwright/test';

import { WalletDefaultNetworkConfigurationIds } from '@leather.io/models';
import { SignPsbtRequestParams } from '@leather.io/rpc';

import { test } from '../../fixtures/fixtures';

// TODO: Refactor these tests to create the PSBT instances with btc.Transaction
// rather than using the pre-made hex payload. There is currently an open issue
// with playwright that is preventing us from using btc-signer lib here.
// https://github.com/microsoft/playwright/issues/17075'

// See test-app for PSBT used in these tests
const unsignedPsbtHexWithThreeInputs =
  '70736274ff0100a402000000030c9199d8079e6fe8a6c78ac9c4e0311c97c9fcdc8b5586c56d191b6d98c0035e0000000000ffffffff47b2d3b4e816729d3a4b689a3b5c3383bce0709b648b4fbfc90a08ebb17ec8130000000000ffffffff8bf7b815a030190b30d5937b3426550d7e0609242adaa8b114577e1363211fed0000000000ffffffff016400000000000000160014a8113965cee4d5ffa2d9996a204866a58200131d00000000000100710100000001b39d61fbab1cb5f2c082f701e749b30b5b99159b4fb5382be9a190f7544e630c0000000000fdffffff0240fa100000000000160014a8113965cee4d5ffa2d9996a204866a58200131d9e652e020000000016001436d197d642a9b02fa0d31b34fe0eab93f273a3c841b2260000010071010000000126496ccdbab53f2956a2b45e052479e8bb8f157fb0169f91413edbd863e8e38b010000000000000000021027000000000000160014a8113965cee4d5ffa2d9996a204866a58200131df3140000000000001600148027825ee06ad337f9716df8137a1b651163c5b041b226000001007101000000018bf7b815a030190b30d5937b3426550d7e0609242adaa8b114577e1363211fed01000000000000000002701700000000000016001419f793aca8e151a4f0aad0c94656a40bdc4fc8793467160000000000160014a8113965cee4d5ffa2d9996a204866a58200131d000000000000';

const signedAllPsbt =
  '70736274ff0100a402000000030c9199d8079e6fe8a6c78ac9c4e0311c97c9fcdc8b5586c56d191b6d98c0035e0000000000ffffffff47b2d3b4e816729d3a4b689a3b5c3383bce0709b648b4fbfc90a08ebb17ec8130000000000ffffffff8bf7b815a030190b30d5937b3426550d7e0609242adaa8b114577e1363211fed0000000000ffffffff016400000000000000160014a8113965cee4d5ffa2d9996a204866a58200131d00000000000100710100000001b39d61fbab1cb5f2c082f701e749b30b5b99159b4fb5382be9a190f7544e630c0000000000fdffffff0240fa100000000000160014a8113965cee4d5ffa2d9996a204866a58200131d9e652e020000000016001436d197d642a9b02fa0d31b34fe0eab93f273a3c841b22600220203fe21e3444109e30ff7d19da0f530c344cad2e35fbee89afb2413858e4a9d7aa54830450221009b5f6568ae904b9c2c1fcd318e269b6092bf6355280b2efa409cc69ac8ba8cb302204c708d139f895e7fe3d61446f4ead9fba6808ce064194b7ec7d8fae1f26444900100010071010000000126496ccdbab53f2956a2b45e052479e8bb8f157fb0169f91413edbd863e8e38b010000000000000000021027000000000000160014a8113965cee4d5ffa2d9996a204866a58200131df3140000000000001600148027825ee06ad337f9716df8137a1b651163c5b041b22600220203fe21e3444109e30ff7d19da0f530c344cad2e35fbee89afb2413858e4a9d7aa547304402200630e0323e156df379f2829543771424613d979395f1717403f43279e9e7fa5c02207dce2e66cad0314f3190e353114c07e91f797b65217d6ca0101a807ce84af21a010001007101000000018bf7b815a030190b30d5937b3426550d7e0609242adaa8b114577e1363211fed01000000000000000002701700000000000016001419f793aca8e151a4f0aad0c94656a40bdc4fc8793467160000000000160014a8113965cee4d5ffa2d9996a204866a58200131d000000000000';

const signedOnlyIndexZeroPsbt =
  '70736274ff0100a402000000030c9199d8079e6fe8a6c78ac9c4e0311c97c9fcdc8b5586c56d191b6d98c0035e0000000000ffffffff47b2d3b4e816729d3a4b689a3b5c3383bce0709b648b4fbfc90a08ebb17ec8130000000000ffffffff8bf7b815a030190b30d5937b3426550d7e0609242adaa8b114577e1363211fed0000000000ffffffff016400000000000000160014a8113965cee4d5ffa2d9996a204866a58200131d00000000000100710100000001b39d61fbab1cb5f2c082f701e749b30b5b99159b4fb5382be9a190f7544e630c0000000000fdffffff0240fa100000000000160014a8113965cee4d5ffa2d9996a204866a58200131d9e652e020000000016001436d197d642a9b02fa0d31b34fe0eab93f273a3c841b22600220203fe21e3444109e30ff7d19da0f530c344cad2e35fbee89afb2413858e4a9d7aa54830450221009b5f6568ae904b9c2c1fcd318e269b6092bf6355280b2efa409cc69ac8ba8cb302204c708d139f895e7fe3d61446f4ead9fba6808ce064194b7ec7d8fae1f26444900100010071010000000126496ccdbab53f2956a2b45e052479e8bb8f157fb0169f91413edbd863e8e38b010000000000000000021027000000000000160014a8113965cee4d5ffa2d9996a204866a58200131df3140000000000001600148027825ee06ad337f9716df8137a1b651163c5b041b226000001007101000000018bf7b815a030190b30d5937b3426550d7e0609242adaa8b114577e1363211fed01000000000000000002701700000000000016001419f793aca8e151a4f0aad0c94656a40bdc4fc8793467160000000000160014a8113965cee4d5ffa2d9996a204866a58200131d000000000000';

test.describe('Sign PSBT', () => {
  test.beforeEach(async ({ extensionId, globalPage, onboardingPage, page }) => {
    await globalPage.setupAndUseApiCalls(extensionId);
    await onboardingPage.signInWithTestAccount(extensionId);
    await page.goto('localhost:3000');
  });

  function clickActionButton(context: BrowserContext) {
    return async (buttonToPress: 'Cancel' | 'Confirm') => {
      const popup = await context.waitForEvent('page');
      await popup.waitForTimeout(1000);
      const btn = popup.locator(`text="${buttonToPress}"`);
      await btn.click();
    };
  }

  async function clickErrorCloseWindowButton(context: BrowserContext) {
    const popup = await context.waitForEvent('page');
    await popup.waitForTimeout(1000);
    const errorMsg = popup.locator('text="Failed to sign"');
    const btn = popup.locator('text="Close window"');
    test.expect(errorMsg).toBeTruthy();
    await btn.click();
  }

  async function interceptBroadcastRequest(context: BrowserContext) {
    const popup = await context.waitForEvent('page');
    const requestPromise = popup.waitForRequest('**/*');
    await popup.route('**/*', async route => await route.abort());
    return requestPromise;
  }

  const signAllParams = {
    hex: unsignedPsbtHexWithThreeInputs,
    network: WalletDefaultNetworkConfigurationIds.testnet,
  };

  function initiatePsbtSigning(page: Page) {
    return async (params: SignPsbtRequestParams & { broadcast?: boolean }) =>
      page.evaluate(
        async params =>
          (window as any).LeatherProvider.request('signPsbt', {
            ...params,
          }).catch((e: unknown) => e),
        { ...params }
      );
  }

  test('that all inputs are signed even if the number of inputs is greater than vout index', async ({
    page,
    context,
  }) => {
    const [result] = await Promise.all([
      initiatePsbtSigning(page)(signAllParams),
      clickActionButton(context)('Confirm'),
    ]);

    delete result.id;

    test.expect(result).toEqual({
      jsonrpc: '2.0',
      result: { hex: signedAllPsbt },
    });
  });

  test('that only requested inputs are signed', async ({ page, context }) => {
    const [result] = await Promise.all([
      initiatePsbtSigning(page)({ ...signAllParams, signAtIndex: 0 }),
      clickActionButton(context)('Confirm'),
    ]);

    delete result.id;

    test.expect(result).toEqual({
      jsonrpc: '2.0',
      result: { hex: signedOnlyIndexZeroPsbt },
    });
  });

  test('that the request can be signed and broadcast', async ({ page, context }) => {
    const requestPromise = interceptBroadcastRequest(context);

    const [result] = await Promise.all([
      initiatePsbtSigning(page)({ ...signAllParams, broadcast: true }),
      clickActionButton(context)('Confirm'),
    ]);

    delete result.id;

    test.expect(result).toEqual({
      jsonrpc: '2.0',
      result: { hex: signedAllPsbt },
    });

    const request = await requestPromise;
    const requestBody = request.postDataBuffer();
    test.expect(requestBody).toBeDefined();
  });

  test('that the request to sign can be canceled', async ({ page, context }) => {
    const [result] = await Promise.all([
      initiatePsbtSigning(page)(signAllParams),
      clickActionButton(context)('Cancel'),
    ]);

    delete result.id;

    test.expect(result).toEqual({
      jsonrpc: '2.0',
      error: {
        code: 4001,
        message: 'User rejected signing PSBT request',
      },
    });
  });

  test('that a failed request occurs if an invalid index is provided', async ({
    page,
    context,
  }) => {
    const [result] = await Promise.all([
      initiatePsbtSigning(page)({ ...signAllParams, signAtIndex: 4 }),
      clickActionButton(context)('Confirm'),
      clickErrorCloseWindowButton(context),
    ]);

    delete result.id;

    test.expect(result).toEqual({
      jsonrpc: '2.0',
      error: {
        code: 4001,
        message: 'User rejected signing PSBT request',
      },
    });
  });
});
