import {it,expect} from 'vitest';
import {validImage} from '../../src/integrations/media.js';
it('rejects HTML disguised as an image',()=>{expect(validImage(Buffer.from('<script>alert(1)</script>'),'image/png')).toBe(false);expect(validImage(Buffer.from('<svg/>'),'image/svg+xml')).toBe(false);});
it('requires matching PNG and WebP signatures',()=>{const png=Buffer.from([137,80,78,71,13,10,26,10]);expect(validImage(png,'image/png')).toBe(true);expect(validImage(png,'image/jpeg')).toBe(false);expect(validImage(Buffer.from('RIFF1234WEBPdata'),'image/webp')).toBe(true);});
