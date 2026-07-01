import { parseString } from 'xml2js';

// 解析 XML（Promise 封装）
export function parseXml(xml) {
  return new Promise((resolve, reject) => {
    parseString(xml, { explicitArray: false }, (err, result) => {
      if (err) reject(err);
      else resolve(result.xml || {});
    });
  });
}
