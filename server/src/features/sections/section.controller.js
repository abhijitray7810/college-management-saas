import { sectionService } from './section.service.js';
import { catchAsync } from '../../shared/utils/catchAsync.js';

export const sectionController = {
  create: catchAsync(async (req, res) => {
    const section = await sectionService.create(
      req.body,
      req.user.role,
      req.user.departmentId
    );
    res.status(201).json({
      success: true,
      message: 'Section created successfully',
      data: section,
    });
  }),

  getAll: catchAsync(async (req, res) => {
    const sections = await sectionService.getAll(
      req.query,
      req.user.role,
      req.user.departmentId
    );
    res.status(200).json({
      success: true,
      data: sections,
    });
  }),

  getById: catchAsync(async (req, res) => {
    const section = await sectionService.getById(
      req.params.id,
      req.user.role,
      req.user.departmentId
    );
    res.status(200).json({
      success: true,
      data: section,
    });
  }),

  assignStudents: catchAsync(async (req, res) => {
    const assignments = await sectionService.assignStudents(
      req.params.id,
      req.body.studentIds,
      req.user.role,
      req.user.departmentId
    );
    res.status(200).json({
      success: true,
      message: 'Students assigned to section successfully',
      data: assignments,
    });
  }),

  removeStudent: catchAsync(async (req, res) => {
    const result = await sectionService.removeStudent(
      req.params.id,
      req.params.studentId,
      req.user.role,
      req.user.departmentId
    );
    res.status(200).json({
      success: true,
      message: result.message,
    });
  }),

  update: catchAsync(async (req, res) => {
    const section = await sectionService.update(
      req.params.id,
      req.body,
      req.user.role,
      req.user.departmentId
    );
    res.status(200).json({
      success: true,
      message: 'Section updated successfully',
      data: section,
    });
  }),

  delete: catchAsync(async (req, res) => {
    const result = await sectionService.delete(
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
