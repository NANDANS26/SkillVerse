// src/utils/response.js
export const ok = (res, data = {}, status = 200) => {
  return res.status(status).json({ success: true, ...data });
};

export const fail = (res, message = "Server error", status = 500) => {
  return res.status(status).json({ success: false, message });
};
