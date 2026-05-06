import { batchService } from './batch.service.js';
import { catchAsync } from '../../shared/utils/catchAsync.js';

export const batchController = {
  create: catchAsync(async (req, res) => {
    const batch = await batchService.create(
      req.body,
      req.user.role,
      req.user.departmentId
    );
    res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      data: batch,
    });
  }),

  getAll: catchAsync(async (req, res) => {
    const batches = await batchService.getAll(
      req.query,
      req.user.role,
      req.user.departmentId
    );
    res.status(200).json({
      success: true,
      data: batches,
    });
  }),

  getById: catchAsync(async (req, res) => {
    const batch = await batchService.getById(
      req.params.id,
      req.user.role,
      req.user.departmentId
    );
    res.status(200).json({
      success: true,
      data: batch,
    });
  }),

  assignSubjects: catchAsync(async (req, res) => {
    const assignments = await batchService.assignSubjects(
      req.params.id,
      req.body.subjectIds,
      req.body.hoursPerWeek,
      req.user.role,
      req.user.departmentId
    );
    res.status(200).json({
      success: true,
      message: 'Subjects assigned to batch successfully',
      data: assignments,
    });
  }),

  removeSubject: catchAsync(async (req, res) => {
    const result = await batchService.removeSubject(
      req.params.id,
      req.params.subjectId,
      req.user.role,
      req.user.departmentId
    );
    res.status(200).json({
      success: true,
      message: result.message,
    });
  }),

  update: catchAsync(async (req, res) => {
    const batch = await batchService.update(
      req.params.id,
      req.body,
      req.user.role,
      req.user.departmentId
    );
    res.status(200).json({
      success: true,
      message: 'Batch updated successfully',
      data: batch,
    });
  }),

  delete: catchAsync(async (req, res) => {
    const result = await batchService.delete(
      req.params.id,
      req.user.role,
      req.user.departmentId
    );
    res.status(200).json({
      success: true,
      message: result.message,
    });
  }),
};
