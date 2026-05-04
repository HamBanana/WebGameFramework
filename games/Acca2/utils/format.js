// games/Acca/utils/format.js — formatting helpers used by HUD/log.

(function (GF) {
  'use strict';
  GF.Acca = GF.Acca || {};

  const F = {
    money(n) {
      const sign = n < 0 ? '-' : '';
      const abs  = Math.abs(Math.round(n));
      return sign + '$' + abs.toLocaleString('en-US');
    },
    percent(p, decimals) {
      const d = decimals == null ? 0 : decimals;
      return (p * 100).toFixed(d) + '%';
    },
    delta(n) {
      return (n >= 0 ? '+' : '') + n;
    },
    truncate(str, max) {
      if (!str) return '';
      return str.length > max ? str.slice(0, max - 1) + '…' : str;
    },
    /** Round to a given step (e.g. roundTo(123, 5) → 125). */
    roundTo(n, step) { return Math.round(n / step) * step; },
  };

  GF.Acca.format = F;

})(window.GF = window.GF || {});
