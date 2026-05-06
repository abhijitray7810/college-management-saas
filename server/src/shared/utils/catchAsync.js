/**
 * catchAsync - Wrapper for async controller functions
 * Catches errors and passes them to the next middleware (error handler)
 * 
 * Usage:
 * const catchAsync = require('../utils/catchAsync');
 * 
 * exports.getAll = catchAsync(async (req, res, next) => {
 *   const data = await Model.findAll();
 *   res.status(200).json({ success: true, data });
 * });
 */

export const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default catchAsync;
