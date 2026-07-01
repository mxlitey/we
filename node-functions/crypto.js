import crypto from 'crypto';

// PKCS7 解码
function pkcs7Decode(data) {
  const pad = data[data.length - 1];
  if (pad < 1 || pad > 32) {
    return data;
  }
  return data.slice(0, data.length - pad);
}

// AES-256-CBC 解密
export function decryptMessage(encrypted, encodingAesKey) {
  const aesKey = Buffer.from(encodingAesKey + '=', 'base64');
  const iv = aesKey.slice(0, 16);
  const encryptedBuffer = Buffer.from(encrypted, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
  decipher.setAutoPadding(false);

  const decrypted = pkcs7Decode(Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]));
  const msgLen = decrypted.readUInt32BE(16);
  return decrypted.slice(20, 20 + msgLen).toString('utf8');
}

// 计算签名
export function calcSignature(...parts) {
  return crypto.createHash('sha1').update(parts.sort().join('')).digest('hex');
}
