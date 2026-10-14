import {it,expect,vi,afterEach} from 'vitest';
import {payHereRefund} from '../../src/integrations/refunds.js';
afterEach(()=>vi.unstubAllEnvs());
const credentials=()=>{vi.stubEnv('PAYHERE_APP_ID','unit-test-app');vi.stubEnv('PAYHERE_APP_SECRET','unit-test-secret');};
it('uses exact decimal amounts and the original payment ID',async()=>{
 credentials();const send=vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({access_token:'test-token'})).mockResolvedValueOnce(Response.json({status:1,data:560034010257}));
 expect(await payHereRefund('320027150501',10050n,'Test refund',send)).toEqual({status:'SUCCEEDED',reference:'payhere:refund:560034010257'});
 expect(JSON.parse(String(send.mock.calls[1][1]?.body))).toEqual({payment_id:'320027150501',amount:'100.50',description:'Test refund'});
 expect(send).toHaveBeenCalledTimes(2);
});
it('holds an uncertain timeout without retrying the monetary request',async()=>{
 credentials();const send=vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({access_token:'test-token'})).mockRejectedValueOnce(Error('timeout'));
 expect(await payHereRefund('123',100n,'Test refund',send)).toEqual({status:'UNKNOWN'});expect(send).toHaveBeenCalledTimes(2);
});
it('accepts a documented provider failure without inventing success',async()=>{
 credentials();const send=vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({access_token:'test-token'})).mockResolvedValueOnce(Response.json({status:-1,data:null}));
 expect(await payHereRefund('123',100n,'Test refund',send)).toEqual({status:'FAILED'});
});
it('does not send a refund when authentication fails',async()=>{
 credentials();const send=vi.fn<typeof fetch>().mockResolvedValueOnce(new Response('',{status:401}));
 await expect(payHereRefund('123',100n,'Test refund',send)).rejects.toThrow('authentication');expect(send).toHaveBeenCalledTimes(1);
});
