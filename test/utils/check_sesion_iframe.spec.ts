import {createSessionCheckerFrame} from "../../src/utils";

describe('checkSessionIframe', function (){
  it('should have start and stop methods', function () {
    // @ts-expect-error
    const checker = createSessionCheckerFrame({ url: 'http://test.url'})

    expect(checker).toHaveProperty('start', expect.any(Function))
    expect(checker).toHaveProperty('stop', expect.any(Function))
  });

  it('should throw an error if url is not defined', function () {
    // @ts-expect-error
    const checker = createSessionCheckerFrame({ url: 'http://test.url'})

  });
})
