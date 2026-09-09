/**
 * Date and time utility functions.
 */

function formatDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

function formatDateTime(date) {
  return new Date(date).toISOString();
}

function isExpired(expiryDate) {
  return new Date(expiryDate) < new Date();
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function timeSince(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}

module.exports = { formatDate, formatDateTime, isExpired, addDays, timeSince };
