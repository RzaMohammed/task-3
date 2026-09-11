// Standardized API response helper
const sendSuccess = (res, data, status = 200) => {
  return res.status(status).json({ success: true, data });
};

const sendError = (res, message, status = 500) => {
  return res.status(status).json({ success: false, error: message });
};

module.exports = { sendSuccess, sendError };
