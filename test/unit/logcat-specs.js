import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mochawait';
import sinon from 'sinon';
import * as teen_process from 'teen_process';
import events from 'events';
import Logcat from '../../lib/logcat';

chai.use(chaiAsPromised);

describe('logcat', async () => {
  let adb = {path: 'dummyPath', defaultArgs: []};
  let logcat = new Logcat({adb: adb, debug: false, debugTrace: false});
  let withMocks = (fn) => {
    return () => {
      let mocks = {};
      beforeEach(async () => {
        mocks.teen_process = sinon.mock(teen_process);
      });
      afterEach(() => {
        mocks.teen_process.restore();
      });
      fn(mocks);
    };
  };
  describe('startCapture', withMocks((mocks) => {
    it('should correctly call subprocess and should resolve promise', async () => {
      let conn = new events.EventEmitter();
      conn.start = () => { };
      mocks.teen_process.expects("SubProcess")
        .once().withExactArgs('dummyPath', ['logcat'])
        .returns(conn);
      setTimeout(function () {
        conn.emit('lines-stdout',['- beginning of system\r']);
      }, 0);
      await logcat.startCapture();
      let logs = logcat.getLogs();
      logs.should.have.length.above(0);
      mocks.teen_process.verify();
    });
    it('should correctly call subprocess and should reject promise', async () => {
      let conn = new events.EventEmitter();
      conn.start = () => { };
      mocks.teen_process.expects("SubProcess")
        .once().withExactArgs('dummyPath', ['logcat'])
        .returns(conn);
      setTimeout(function () {
        conn.emit('lines-stderr',['execvp()']);
      }, 0);
      await logcat.startCapture().should.eventually.be.rejectedWith('Logcat');
      mocks.teen_process.verify();
    });
  }));
});
