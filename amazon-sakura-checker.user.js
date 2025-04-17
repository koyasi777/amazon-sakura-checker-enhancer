// ==UserScript==
// @name         Amazon商品ページにサクラチェッカーの評価を直接表示💡
// @namespace    https://github.com/koyasi777/amazon-sakura-checker-enhancer
// @version      6.1
// @description  Amazon.co.jpの商品ページにサクラチェッカーのスコアと判定を高速表示！CORS突破、軽量キャッシュ対応、レビューの信頼性を即チェック！
// @author       koyasi777
// @match        https://www.amazon.co.jp/*
// @grant        GM_xmlhttpRequest
// @connect      sakura-checker.jp
// @license      MIT
// @homepageURL  https://github.com/koyasi777/amazon-sakura-checker-enhancer
// @supportURL   https://github.com/koyasi777/amazon-sakura-checker-enhancer/issues
// ==/UserScript==

(function () {
  'use strict';

  const CHECK_INTERVAL = 500;
  const MAX_RETRIES = 20;
  const DEBOUNCE_TIME = 200;
  let currentASIN = null;
  let debounceTimer = null;

  function getASIN() {
    const urlMatch = location.pathname.match(/\/dp\/([A-Z0-9]{10})/);
    if (urlMatch) return urlMatch[1];
    const meta = document.querySelector('[data-asin]')?.getAttribute('data-asin');
    if (meta && /^[A-Z0-9]{10}$/.test(meta)) return meta;
    const input = document.querySelector('input[name="ASIN"]')?.value;
    if (input && /^[A-Z0-9]{10}$/.test(input)) return input;
    return null;
  }

  function injectStyles() {
    if (document.getElementById('sakuraCheckerStyle')) return;
    const style = document.createElement('style');
    style.id = 'sakuraCheckerStyle';
    style.textContent = 
      .sakuraCheckerEmbed {
        margin-top: 12px;
        padding: 16px;
        border: 1px solid #e0e0e0;
        background: #f9f9f9;
        border-radius: 8px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        font-size: 14px;
        color: #333;
        line-height: 1.6;
      }
      .sakuraCheckerEmbed table {
        width: 100%;
        margin-top: 10px;
        border-collapse: collapse;
      }
      .sakuraCheckerEmbed th,
      .sakuraCheckerEmbed td {
        padding: 4px 8px;
      }
      .sakuraCheckerEmbed thead {
        background: #efefef;
      }
      .sakuraCheckerEmbed .a-box {
        border: none;
        padding: 0;
      }
    ;
    document.head.appendChild(style);
  }

  function extractSummaryScore(img) {
    const alt = img?.getAttribute('alt') || '';
    const fromAlt = alt.match(/(\d{1,3})%/)?.[1];
    const sibling = img?.nextElementSibling;
    const siblingText = sibling?.querySelector?.('span')?.textContent?.trim();
    const fromSibling = siblingText?.match(/(\d{1,3})%/)?.[1];
    const src = img?.src || '';
    const lvMatch = src.match(/lv(\d{2,3})\.png/)?.[1];
    const fromSrc = lvMatch === '100' ? '99' : lvMatch;
    const score = fromAlt || fromSibling || fromSrc;
    return score ? ${score}% : '？';
  }

  function getJudgmentColor(judgment) {
    if (/危険/.test(judgment)) return '#e74c3c';
    if (/警告/.test(judgment)) return '#f39c12';
    if (/確認/.test(judgment)) return '#2980b9';
    if (/安全/.test(judgment)) return '#2ecc71';
    return '#999';
  }

  function getScoreColor(scoreStr) {
    const score = parseInt(scoreStr);
    if (isNaN(score)) return '#999';
    if (score >= 80) return '#c0392b';
    if (score >= 60) return '#f39c12';
    if (score >= 20) return '#2980b9';
    return '#27ae60';
  }

  function fetchSakuraData(asin, attempt = 1) {
    const storageKey = sakuraCache_${asin};
    const stored = localStorage.getItem(storageKey);
    if (stored) return Promise.resolve(JSON.parse(stored));

    const url = https://sakura-checker.jp/search/${asin};

    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        onload: (response) => {
          try {
            const html = response.responseText;
            const doc = new DOMParser().parseFromString(html, 'text/html');

            const summaryImg = doc.querySelector('.sakura-rating img') ||
                               doc.querySelector('.sakura-num img') ||
                               doc.querySelector('.item-rv-lv img');
            const summaryScore = extractSummaryScore(summaryImg);

            const chartData = Array.from(doc.querySelectorAll('.chartBlock .column')).map(col => ({
              score: col.querySelector('.c100 span')?.textContent?.trim() || '？',
              label: col.querySelector('.label img')?.getAttribute('alt') || '？',
              category: col.querySelector('.caption a')?.textContent?.trim() || '？'
            }));

            const result = { summaryScore, chartData, link: url };
            localStorage.setItem(storageKey, JSON.stringify(result));
            resolve(result);
          } catch (e) {
            console.error('[サクラチェッカー] パースエラー:', e);
            reject(e);
          }
        },
        onerror: (err) => {
          if (attempt < 3) {
            console.warn([サクラチェッカー] リトライ ${attempt} 回目);
            setTimeout(() => {
              fetchSakuraData(asin, attempt + 1).then(resolve).catch(reject);
            }, 1000 * attempt);
          } else {
            console.error('[サクラチェッカー] CORS取得失敗:', err);
            reject(err);
          }
        }
      });
    });
  }

  function createCard(data, asin) {
    injectStyles();
    const wrapper = document.createElement('div');
    wrapper.className = 'sakuraCheckerEmbed a-box a-spacing-base';
    wrapper.setAttribute('data-asin', asin);
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', 'サクラチェッカー情報');

    const chartRows = data.chartData.map(row => 
      <tr>
        <td>${row.category}</td>
        <td style="font-weight: bold; color: ${getScoreColor(row.score)};">${row.score}</td>
        <td style="color: ${getJudgmentColor(row.label)};">${row.label}</td>
      </tr>
    ).join('');

    wrapper.innerHTML = 
      <div style="font-weight: 600; font-size: 15px; margin-bottom: 6px;">🔍 サクラチェッカー簡易分析</div>
      <div><strong>全体サクラ度：</strong><span style="font-weight: bold; color: ${parseInt(data.summaryScore) >= 60 ? '#e74c3c' : '#2ecc71'}; font-size: 16px;">${data.summaryScore}</span></div>
      <table>
        <thead>
          <tr>
            <th>カテゴリ</th>
            <th>スコア</th>
            <th>判定</th>
          </tr>
        </thead>
        <tbody>${chartRows}</tbody>
      </table>
      <div style="margin-top: 10px;">
        <a href="${data.link}" target="_blank" style="color: #0073e6; text-decoration: underline;">▶ サクラチェッカーで詳細を見る</a>
      </div>
    ;
    return wrapper;
  }

  function hasAlreadyInserted(asin) {
    return document.querySelector(.sakuraCheckerEmbed[data-asin="${asin}"]);
  }

  function getInsertTarget() {
    return document.getElementById('averageCustomerReviews_feature_div')
        || document.querySelector('#reviewsMedley')
        || document.querySelector('#centerCol')
        || document.querySelector('#dp')
        || null;
  }

  async function tryInsert(asin, attempt = 0) {
    if (hasAlreadyInserted(asin)) return;

    const target = getInsertTarget();
    if (!target) {
      if (attempt < MAX_RETRIES) {
        setTimeout(() => tryInsert(asin, attempt + 1), CHECK_INTERVAL);
      } else {
        console.warn('[サクラチェッカー] 挿入位置が見つかりません');
      }
      return;
    }

    const data = await fetchSakuraData(asin);
    if (!data) {
      const err = document.createElement('div');
      err.textContent = '⚠ サクラチェッカー情報を取得できませんでした';
      err.style.color = 'red';
      target.insertAdjacentElement('afterend', err);
      return;
    }

    const card = createCard(data, asin);
    requestIdleCallback(() => {
      target.insertAdjacentElement('afterend', card);
      console.log([サクラチェッカー] 表示完了: ${asin});
    });
  }

  function onPageChangeDebounced() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const asin = getASIN();
      if (!asin || asin === currentASIN) return;
      currentASIN = asin;
      tryInsert(asin);
    }, DEBOUNCE_TIME);
  }

  const observerTarget = document.getElementById('dp-container') || document.body;
  const observer = new MutationObserver(onPageChangeDebounced);
  observer.observe(observerTarget, { childList: true, subtree: true });
  window.addEventListener('load', onPageChangeDebounced);
})();
