import {runIframe} from "../../src/utils";
import {PAError} from "../../src";

describe('runIframe', () => {
  const setup = (customMessage?: MessageEvent) => {
    const iframe = {
      setAttribute: jest.fn(),
      style: { display: '' }
    };
    const url = 'https://authorize.com';
    const origin =
      (customMessage && customMessage.origin) || 'https://origin.com';
    window.addEventListener = <any>jest.fn((message, callback) => {
      expect(message).toBe('message');
      callback(customMessage);
    });
    window.removeEventListener = jest.fn();
    window.document.createElement = <any>jest.fn(type => {
      expect(type).toBe('iframe');
      return iframe;
    });
    window.document.body.contains = () => true;
    window.document.body.appendChild = jest.fn();
    window.document.body.removeChild = jest.fn();
    return { iframe, url, origin };
  };
  it('handles iframe correctly', async () => {
    const origin = 'https://origin.com';
    const message: MessageEvent = {
      origin,
      // @ts-ignore
      source: { close: jest.fn() },
      data: {
        type: 'authorization_response',
        response: { id_token: 'id_token' }
      }
    };
    const { iframe, url } = setup(message);
    jest.useFakeTimers();
    await runIframe(url, {eventOrigin: origin});
    jest.runAllTimers();
    // @ts-ignore
    expect(message.source.close).toHaveBeenCalled();
    expect(window.document.body.appendChild).toHaveBeenCalledWith(iframe);
    expect(window.document.body.removeChild).toHaveBeenCalledWith(iframe);
    expect(iframe.setAttribute.mock.calls).toMatchObject([
      ['src', url]
    ]);
    expect(iframe.style.display).toBe('none');
  });
  describe('with invalid messages', () => {
    [
      '',
      {},
      { origin: 'other-origin' },
      { data: 'test' },
      { data: { type: 'other-type' } }
    ].forEach(m => {
      it(`ignores invalid messages: ${JSON.stringify(m)}`, async () => {
        const { iframe, url, origin } = setup(m as any);
        jest.useFakeTimers();
        const promise = runIframe(url, {eventOrigin: origin});
        jest.runAllTimers();
        await expect(promise).rejects.toThrow(PAError);
        expect(window.document.body.removeChild).toHaveBeenCalledWith(iframe);
      });
    });
  });
  it('returns authorization response message', async () => {
    const origin = 'https://origin.com';
    const message: MessageEvent = {
      origin,
      // @ts-ignore
      source: { close: jest.fn() },
      data: {
        type: 'authorization_response',
        response: { id_token: 'id_token' }
      }
    };
    const { iframe, url } = setup(message);
    jest.useFakeTimers();
    await expect(runIframe(url, {eventOrigin: origin})).resolves.toMatchObject(
      message.data
    );
    jest.runAllTimers();
    // @ts-ignore
    expect(message.source!.close).toHaveBeenCalled();
    expect(window.document.body.removeChild).toHaveBeenCalledWith(iframe);
  });

  it('returns authorization error message', async () => {
    const origin = 'https://origin.com';

    const message: MessageEvent = {
      origin,
      // @ts-ignore
      source: { close: jest.fn() },
      data: {
        type: 'authorization_response',
        response: {
          error: 'error',
          error_description: 'error_description'
        }
      }
    };

    const { iframe, url } = setup(message);
    jest.useFakeTimers();
    await expect(runIframe(url, {eventOrigin: origin})).rejects.toThrow(PAError);
    jest.runAllTimers();
    // @ts-ignore
    expect(message.source.close).toHaveBeenCalled();
    expect(window.document.body.removeChild).toHaveBeenCalledWith(iframe);
  });

  it('times out after timeout', async () => {
    const { iframe, url, origin } = setup('' as any);
    const timeout = 10 * 1000;
    jest.useFakeTimers();
    const promise = runIframe(url, {eventOrigin: origin, timeout: timeout});
    jest.runTimersToTime(timeout);
    await expect(promise).rejects.toThrow(PAError);
    expect(window.document.body.removeChild).toHaveBeenCalledWith(iframe);
  });
});
